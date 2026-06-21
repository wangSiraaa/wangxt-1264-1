using Microsoft.EntityFrameworkCore;
using TeleConsult.Api.Data;
using TeleConsult.Api.Models;

namespace TeleConsult.Api.Services;

public interface ITransferService
{
    Task<List<Transfer>> ListAsync(string? status, bool? greenChannel);
    Task<Transfer?> GetAsync(string id);
    Task<Transfer> CreateAsync(CreateTransferInput input, string coordinatorId, string coordinatorName);
    Task<Transfer> UpdateStatusAsync(string id, string newStatus);
}

public record CreateTransferInput(string RecordId, string AmbulanceId, string BedId);

public class TransferService : ITransferService
{
    private readonly AppDbContext _db;
    public TransferService(AppDbContext db) => _db = db;

    public async Task<List<Transfer>> ListAsync(string? status, bool? greenChannel)
    {
        var q = _db.Transfers.AsNoTracking().AsQueryable();
        if (!string.IsNullOrEmpty(status)) q = q.Where(t => t.Status == status);
        if (greenChannel.HasValue && greenChannel.Value) q = q.Where(t => t.GreenChannel);
        return await q.OrderByDescending(t => t.CreatedAt).ToListAsync();
    }

    public async Task<Transfer?> GetAsync(string id) =>
        await _db.Transfers.FirstOrDefaultAsync(t => t.Id == id);

    public async Task<Transfer> CreateAsync(CreateTransferInput input, string coordinatorId, string coordinatorName)
    {
        var rec = await _db.MedicalRecords.FindAsync(input.RecordId)
            ?? throw new KeyNotFoundException("病历不存在");

        var amb = await _db.Ambulances.FindAsync(input.AmbulanceId)
            ?? throw new KeyNotFoundException("救护车不存在");
        if (amb.Status != "idle")
            throw new InvalidOperationException("该救护车正在执行任务，无法调度");

        var bed = await _db.Beds.FindAsync(input.BedId)
            ?? throw new KeyNotFoundException("床位不存在");
        if (bed.Status != "available")
            throw new InvalidOperationException("该床位当前不可用");

        // 锁定救护车与床位
        amb.Status = "on_mission";
        bed.Status = "occupied";

        var transfer = new Transfer
        {
            RecordId = input.RecordId,
            AmbulanceId = amb.Id,
            AmbulancePlate = amb.PlateNumber,
            BedId = bed.Id,
            BedNumber = bed.BedNumber,
            Department = bed.Department,
            CoordinatorId = coordinatorId,
            CoordinatorName = coordinatorName,
            PatientName = rec.PatientName,
            Status = "dispatched",
            GreenChannel = rec.GreenChannel,
            DepartureTime = DateTime.UtcNow,
        };
        _db.Transfers.Add(transfer);

        rec.Status = "transferring";
        rec.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return transfer;
    }

    public async Task<Transfer> UpdateStatusAsync(string id, string newStatus)
    {
        var t = await _db.Transfers.FindAsync(id)
            ?? throw new KeyNotFoundException("转运单不存在");

        t.Status = newStatus;
        if (newStatus == "in_transit" && t.DepartureTime is null)
            t.DepartureTime = DateTime.UtcNow;
        if (newStatus == "arrived")
            t.ArrivalTime = DateTime.UtcNow;

        // 到达后释放救护车
        if (newStatus is "received" or "closed")
        {
            if (t.AmbulanceId is not null)
            {
                var amb = await _db.Ambulances.FindAsync(t.AmbulanceId);
                if (amb is not null) amb.Status = "idle";
            }
        }

        var rec = await _db.MedicalRecords.FindAsync(t.RecordId);
        if (rec is not null)
        {
            rec.Status = newStatus == "closed" ? "closed" : "transferring";
            rec.UpdatedAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync();
        return t;
    }
}
