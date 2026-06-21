using Microsoft.AspNetCore.Mvc;
using TeleConsult.Api.DTOs;
using TeleConsult.Api.Services;

namespace TeleConsult.Api.Controllers;

[ApiController]
[Route("api/transfers")]
public class TransfersController : ControllerBase
{
    private readonly ITransferService _transfers;
    private readonly ICurrentUserService _current;

    public TransfersController(ITransferService transfers, ICurrentUserService current)
    {
        _transfers = transfers;
        _current = current;
    }

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] string? status, [FromQuery] bool? greenChannel) =>
        Ok(await _transfers.ListAsync(status, greenChannel));

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(string id)
    {
        var t = await _transfers.GetAsync(id);
        return t is null ? NotFound(new { message = "转运单不存在" }) : Ok(t);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateTransferRequest req)
    {
        if (_current.UserId is null) return Unauthorized();
        try
        {
            var input = new CreateTransferInput(req.RecordId, req.AmbulanceId, req.BedId);
            var t = await _transfers.CreateAsync(input, _current.UserId, _current.FullName!);
            return CreatedAtAction(nameof(Get), new { id = t.Id }, t);
        }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    [HttpPatch("{id}/status")]
    public async Task<IActionResult> UpdateStatus(string id, [FromBody] UpdateTransferStatusRequest req)
    {
        try { return Ok(await _transfers.UpdateStatusAsync(id, req.Status)); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    [HttpPost("{id}/adjust")]
    public async Task<IActionResult> Adjust(string id, [FromBody] AdjustTransferRequest req)
    {
        if (_current.UserId is null) return Unauthorized();
        try
        {
            var input = new AdjustTransferInput(id, req.AmbulanceId, req.BedId, req.ChangeReason);
            var t = await _transfers.AdjustAsync(input, _current.UserId, _current.FullName!);
            return Ok(t);
        }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    [HttpGet("{id}/changes")]
    public async Task<IActionResult> GetChanges(string id)
    {
        var changes = await _transfers.GetChangesAsync(id);
        var dtos = changes.Select(c => new TransferChangeDto(
            c.Id,
            c.TransferId,
            c.ChangeType,
            c.OldAmbulancePlate,
            c.NewAmbulancePlate,
            c.OldBedNumber != null ? $"{c.OldBedNumber}（{c.OldDepartment}）" : null,
            c.NewBedNumber != null ? $"{c.NewBedNumber}（{c.NewDepartment}）" : null,
            c.ChangeReason,
            c.ChangedByName,
            c.CreatedAt
        )).ToList();
        return Ok(dtos);
    }
}
