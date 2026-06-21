using Microsoft.EntityFrameworkCore;
using TeleConsult.Api.Data;
using TeleConsult.Api.Models;

namespace TeleConsult.Api.Services;

public interface IRecordService
{
    Task<List<MedicalRecord>> ListAsync(string? status, bool? critical, bool? greenChannel);
    Task<MedicalRecord?> GetAsync(string id);
    Task<MedicalRecord> CreateAsync(CreateRecordInput input, string doctorId, string doctorName, string orgId);
    Task<List<ImagingIndex>> ListImagesAsync(string recordId);
    Task<ImagingIndex> UploadImageAsync(string recordId, string imagingType, string fileName);
    Task DeleteImageAsync(string imageId);
}

public record CreateRecordInput(
    string PatientName, string PatientGender, int PatientAge, string? PatientPhone,
    string ChiefComplaint, string? PresentIllness,
    decimal? Temperature, int? HeartRate, int? SystolicBP, int? DiastolicBP, int? SpO2,
    bool IsCritical);

public class RecordService : IRecordService
{
    private readonly AppDbContext _db;
    public RecordService(AppDbContext db) => _db = db;

    public async Task<List<MedicalRecord>> ListAsync(string? status, bool? critical, bool? greenChannel)
    {
        var q = _db.MedicalRecords.AsNoTracking().AsQueryable();
        if (!string.IsNullOrEmpty(status)) q = q.Where(r => r.Status == status);
        if (critical.HasValue) q = q.Where(r => r.IsCritical == critical.Value);
        if (greenChannel.HasValue && greenChannel.Value) q = q.Where(r => r.GreenChannel);
        return await q.OrderByDescending(r => r.CreatedAt).ToListAsync();
    }

    public async Task<MedicalRecord?> GetAsync(string id) =>
        await _db.MedicalRecords.Include(r => r.Images).Include(r => r.Consultations)
            .FirstOrDefaultAsync(r => r.Id == id);

    public async Task<MedicalRecord> CreateAsync(CreateRecordInput input, string doctorId, string doctorName, string orgId)
    {
        var rec = new MedicalRecord
        {
            PatientName = input.PatientName,
            PatientGender = input.PatientGender,
            PatientAge = input.PatientAge,
            PatientPhone = input.PatientPhone,
            ChiefComplaint = input.ChiefComplaint,
            PresentIllness = input.PresentIllness,
            Temperature = input.Temperature,
            HeartRate = input.HeartRate,
            SystolicBP = input.SystolicBP,
            DiastolicBP = input.DiastolicBP,
            SpO2 = input.SpO2,
            IsCritical = input.IsCritical,
            Status = "draft",
            DoctorId = doctorId,
            DoctorName = doctorName,
            OrgId = orgId,
        };
        _db.MedicalRecords.Add(rec);
        await _db.SaveChangesAsync();
        return rec;
    }

    public async Task<List<ImagingIndex>> ListImagesAsync(string recordId) =>
        await _db.ImagingIndexes.AsNoTracking().Where(i => i.RecordId == recordId)
            .OrderByDescending(i => i.UploadedAt).ToListAsync();

    public async Task<ImagingIndex> UploadImageAsync(string recordId, string imagingType, string fileName)
    {
        var recExists = await _db.MedicalRecords.AnyAsync(r => r.Id == recordId);
        if (!recExists) throw new KeyNotFoundException("病历不存在");

        var img = new ImagingIndex
        {
            RecordId = recordId,
            ImagingType = imagingType,
            FileName = fileName,
            FilePath = $"/uploads/{recordId}/{fileName}",
        };
        _db.ImagingIndexes.Add(img);

        // 上传首张影像后标记影像完整
        var rec = await _db.MedicalRecords.FindAsync(recordId);
        if (rec is not null && !rec.ImagingComplete)
        {
            rec.ImagingComplete = true;
            rec.UpdatedAt = DateTime.UtcNow;
        }
        await _db.SaveChangesAsync();
        return img;
    }

    public async Task DeleteImageAsync(string imageId)
    {
        var img = await _db.ImagingIndexes.FindAsync(imageId);
        if (img is null) return;
        _db.ImagingIndexes.Remove(img);
        var remaining = await _db.ImagingIndexes.CountAsync(i => i.RecordId == img.RecordId);
        if (remaining - 1 <= 0)
        {
            var rec = await _db.MedicalRecords.FindAsync(img.RecordId);
            if (rec is not null)
            {
                rec.ImagingComplete = false;
                rec.UpdatedAt = DateTime.UtcNow;
            }
        }
        await _db.SaveChangesAsync();
    }
}
