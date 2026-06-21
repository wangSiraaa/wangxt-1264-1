using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TeleConsult.Api.Data;

namespace TeleConsult.Api.Controllers;

[ApiController]
[Route("api")]
public class ResourcesController : ControllerBase
{
    private readonly AppDbContext _db;
    public ResourcesController(AppDbContext db) => _db = db;

    [HttpGet("beds")]
    public async Task<IActionResult> Beds() => Ok(await _db.Beds.AsNoTracking().OrderBy(b => b.Department).ToListAsync());

    [HttpGet("ambulances")]
    public async Task<IActionResult> Ambulances() => Ok(await _db.Ambulances.AsNoTracking().OrderBy(a => a.PlateNumber).ToListAsync());
}
