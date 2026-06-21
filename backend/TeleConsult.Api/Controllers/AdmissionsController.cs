using Microsoft.AspNetCore.Mvc;
using TeleConsult.Api.DTOs;
using TeleConsult.Api.Services;

namespace TeleConsult.Api.Controllers;

[ApiController]
[Route("api/admissions")]
public class AdmissionsController : ControllerBase
{
    private readonly IAdmissionService _admissions;
    private readonly ICurrentUserService _current;

    public AdmissionsController(IAdmissionService admissions, ICurrentUserService current)
    {
        _admissions = admissions;
        _current = current;
    }

    [HttpGet]
    public async Task<IActionResult> List() => Ok(await _admissions.ListAsync());

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateAdmissionRequest req)
    {
        if (_current.UserId is null) return Unauthorized();
        try
        {
            var input = new CreateAdmissionInput(req.TransferId, req.AdmissionDiagnosis, req.Treatment, req.Outcome);
            var r = await _admissions.CreateAsync(input, _current.UserId, _current.FullName!);
            return Ok(r);
        }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }
}
