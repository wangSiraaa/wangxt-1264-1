using Microsoft.AspNetCore.Mvc;
using TeleConsult.Api.DTOs;
using TeleConsult.Api.Services;

namespace TeleConsult.Api.Controllers;

[ApiController]
[Route("api/consultations")]
public class ConsultationsController : ControllerBase
{
    private readonly IConsultationService _consults;
    private readonly ICurrentUserService _current;

    public ConsultationsController(IConsultationService consults, ICurrentUserService current)
    {
        _consults = consults;
        _current = current;
    }

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] string? status) =>
        Ok(await _consults.ListAsync(status));

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(string id)
    {
        var c = await _consults.GetAsync(id);
        return c is null ? NotFound(new { message = "会诊单不存在" }) : Ok(c);
    }

    [HttpPost("{id}/complete")]
    public async Task<IActionResult> Complete(string id, [FromBody] CompleteConsultationRequest req)
    {
        if (_current.UserId is null) return Unauthorized();
        try
        {
            var input = new CompleteConsultInput(req.Diagnosis, req.Opinion, req.Recommendation, req.IsCritical);
            var c = await _consults.CompleteAsync(id, input, _current.UserId, _current.FullName!);
            return Ok(c);
        }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }
}
