using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TeleConsult.Api.Data;
using TeleConsult.Api.DTOs;

namespace TeleConsult.Api.Controllers;

[ApiController]
[Route("api/dashboard")]
public class DashboardController : ControllerBase
{
    private readonly AppDbContext _db;
    public DashboardController(AppDbContext db) => _db = db;

    [HttpGet("stats")]
    public async Task<IActionResult> Stats()
    {
        var today = DateTime.UtcNow.Date;
        var stats = new DashboardStatsDto(
            PendingConsult: await _db.Consultations.CountAsync(c => c.Status == "pending"),
            Consulting: await _db.Consultations.CountAsync(c => c.Status == "completed" &&
                c.CompletedAt.HasValue && c.CompletedAt.Value.Date == today),
            InTransit: await _db.Transfers.CountAsync(t =>
                t.Status == "dispatched" || t.Status == "in_transit" || t.Status == "arrived"),
            GreenChannelActive: await _db.MedicalRecords.CountAsync(r => r.GreenChannel && r.Status != "closed"),
            CompletedToday: await _db.Transfers.CountAsync(t => t.Status == "closed" &&
                _db.AdmissionResults.Any(a => a.TransferId == t.Id && a.ReceivedAt.Date == today)),
            AvailableBeds: await _db.Beds.CountAsync(b => b.Status == "available"));
        return Ok(stats);
    }
}
