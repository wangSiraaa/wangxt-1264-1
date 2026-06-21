using Microsoft.AspNetCore.Mvc;
using TeleConsult.Api.DTOs;
using TeleConsult.Api.Services;

namespace TeleConsult.Api.Controllers;

[ApiController]
[Route("api")]
public class RecordsController : ControllerBase
{
    private readonly IRecordService _records;
    private readonly IConsultationService _consults;
    private readonly ICurrentUserService _current;

    public RecordsController(IRecordService records, IConsultationService consults, ICurrentUserService current)
    {
        _records = records;
        _consults = consults;
        _current = current;
    }

    [HttpGet("records")]
    public async Task<IActionResult> List([FromQuery] string? status, [FromQuery] bool? critical, [FromQuery] bool? greenChannel) =>
        Ok(await _records.ListAsync(status, critical, greenChannel));

    [HttpGet("records/{id}")]
    public async Task<IActionResult> Get(string id)
    {
        var rec = await _records.GetAsync(id);
        return rec is null ? NotFound(new { message = "病历不存在" }) : Ok(rec);
    }

    [HttpPost("records")]
    public async Task<IActionResult> Create([FromBody] CreateRecordRequest req)
    {
        if (_current.UserId is null) return Unauthorized();
        var input = new CreateRecordInput(req.PatientName, req.PatientGender, req.PatientAge, req.PatientPhone,
            req.ChiefComplaint, req.PresentIllness, req.Temperature, req.HeartRate,
            req.SystolicBP, req.DiastolicBP, req.SpO2, req.IsCritical);
        var rec = await _records.CreateAsync(input, _current.UserId, _current.FullName!, _current.OrgId!);
        return CreatedAtAction(nameof(Get), new { id = rec.Id }, rec);
    }

    [HttpGet("records/{recordId}/images")]
    public async Task<IActionResult> ListImages(string recordId) =>
        Ok(await _records.ListImagesAsync(recordId));

    [HttpPost("records/{recordId}/images")]
    public async Task<IActionResult> UploadImage(string recordId, [FromForm] UploadImageRequest req, IFormFile? file)
    {
        var fileName = file?.FileName ?? req.FileName;
        var img = await _records.UploadImageAsync(recordId, req.ImagingType, fileName);
        return Ok(img);
    }

    [HttpDelete("images/{id}")]
    public async Task<IActionResult> DeleteImage(string id)
    {
        await _records.DeleteImageAsync(id);
        return NoContent();
    }

    [HttpPost("records/{recordId}/request-consult")]
    public async Task<IActionResult> RequestConsult(string recordId)
    {
        try
        {
            var consultationId = await _consults.RequestConsultAsync(recordId);
            return Ok(new { consultationId });
        }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }
}
