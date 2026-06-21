using Microsoft.EntityFrameworkCore;
using TeleConsult.Api.Data;
using TeleConsult.Api.Models;

namespace TeleConsult.Api.Services;

public interface IAdmissionService
{
    Task<List<AdmissionResult>> ListAsync();
    Task<AdmissionResult> CreateAsync(CreateAdmissionInput input, string receivedById, string receivedByName);
}

public record CreateAdmissionInput(string TransferId, string AdmissionDiagnosis, string? Treatment, string Outcome);

public class AdmissionService : IAdmissionService
{
    private readonly AppDbContext _db;
    public AdmissionService(AppDbContext db) => _db = db;

    public async Task<List<AdmissionResult>> ListAsync() =>
        await _db.AdmissionResults.AsNoTracking()
            .OrderByDescending(a => a.ReceivedAt).ToListAsync();

    public async Task<AdmissionResult> CreateAsync(CreateAdmissionInput input, string receivedById, string receivedByName)
    {
        var transfer = await _db.Transfers.Include(t => t.Bed).FirstOrDefaultAsync(t => t.Id == input.TransferId)
            ?? throw new KeyNotFoundException("转运单不存在");

        // ===== 业务规则 3: 转诊完成后才能回填接诊结果（需已接收）=====
        if (transfer.Status is not ("received" or "closed"))
            throw new InvalidOperationException("转运单尚未确认接收，无法回填接诊结果");

        if (transfer.Status == "closed")
            throw new InvalidOperationException("该转诊已闭环，不可重复回填");

        // 已存在结果则禁止重复
        var exists = await _db.AdmissionResults.AnyAsync(a => a.TransferId == input.TransferId);
        if (exists) throw new InvalidOperationException("该转运单已回填接诊结果");

        var result = new AdmissionResult
        {
            TransferId = input.TransferId,
            AdmissionDiagnosis = input.AdmissionDiagnosis,
            Treatment = input.Treatment,
            Outcome = input.Outcome,
            ReceivedById = receivedById,
            ReceivedByName = receivedByName,
        };
        _db.AdmissionResults.Add(result);

        // 关闭转运闭环：转运单关闭、病历关闭、床位释放为清洁中
        transfer.Status = "closed";
        if (transfer.BedId is not null)
        {
            var bed = await _db.Beds.FindAsync(transfer.BedId);
            if (bed is not null) bed.Status = "cleaning";
        }
        var rec = await _db.MedicalRecords.FindAsync(transfer.RecordId);
        if (rec is not null)
        {
            rec.Status = "closed";
            rec.UpdatedAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync();
        return result;
    }
}
