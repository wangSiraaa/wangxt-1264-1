using Microsoft.EntityFrameworkCore;
using TeleConsult.Api.Data;
using TeleConsult.Api.Models;

namespace TeleConsult.Api.Services;

public interface IConsultationService
{
    Task<string> RequestConsultAsync(string recordId);
    Task<Consultation?> GetAsync(string id);
    Task<List<Consultation>> ListAsync(string? status);
    Task<Consultation> CompleteAsync(string id, CompleteConsultInput input, string expertId, string expertName);
}

public record CompleteConsultInput(string Diagnosis, string Opinion, string Recommendation, bool IsCritical);

public class ConsultationService : IConsultationService
{
    private readonly AppDbContext _db;
    public ConsultationService(AppDbContext db) => _db = db;

    public async Task<string> RequestConsultAsync(string recordId)
    {
        var rec = await _db.MedicalRecords.Include(r => r.Images)
            .FirstOrDefaultAsync(r => r.Id == recordId)
            ?? throw new KeyNotFoundException("病历不存在");

        // ===== 业务规则 1: 影像资料缺失不能发起专家会诊 =====
        if (!rec.ImagingComplete || rec.Images.Count == 0)
            throw new InvalidOperationException("影像资料缺失，无法发起专家会诊");

        if (rec.Status is "consulting" or "transferring")
            throw new InvalidOperationException("该病历已在会诊/转运流程中，不可重复发起");

        var consultation = new Consultation
        {
            RecordId = recordId,
            ExpertId = string.Empty,
            ExpertName = string.Empty,
            Status = "pending",
        };
        _db.Consultations.Add(consultation);

        rec.Status = "pending_consult";
        rec.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return consultation.Id;
    }

    public async Task<Consultation?> GetAsync(string id) =>
        await _db.Consultations.Include(c => c.Record).ThenInclude(r => r!.Images)
            .FirstOrDefaultAsync(c => c.Id == id);

    public async Task<List<Consultation>> ListAsync(string? status)
    {
        var q = _db.Consultations.Include(c => c.Record).AsNoTracking().AsQueryable();
        if (!string.IsNullOrEmpty(status)) q = q.Where(c => c.Status == status);
        return await q.OrderByDescending(c => c.CreatedAt).ToListAsync();
    }

    public async Task<Consultation> CompleteAsync(string id, CompleteConsultInput input, string expertId, string expertName)
    {
        var cons = await _db.Consultations.Include(c => c.Record)
            .FirstOrDefaultAsync(c => c.Id == id)
            ?? throw new KeyNotFoundException("会诊单不存在");

        if (cons.Status == "completed")
            throw new InvalidOperationException("该会诊已完成");

        cons.Diagnosis = input.Diagnosis;
        cons.Opinion = input.Opinion;
        cons.Recommendation = input.Recommendation;
        cons.IsCritical = input.IsCritical;
        cons.ExpertId = expertId;
        cons.ExpertName = expertName;
        cons.Status = "completed";
        cons.CompletedAt = DateTime.UtcNow;

        // ===== 业务规则 2: 危急值病例自动进入绿色通道 =====
        if (input.IsCritical && cons.Record is not null)
        {
            cons.Record.IsCritical = true;
            cons.Record.GreenChannel = true;
            cons.Record.UpdatedAt = DateTime.UtcNow;
        }
        else if (cons.Record is not null)
        {
            cons.Record.Status = "pending_consult";
            cons.Record.UpdatedAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync();
        return cons;
    }
}
