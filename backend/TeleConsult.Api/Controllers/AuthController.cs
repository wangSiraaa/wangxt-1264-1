using Microsoft.AspNetCore.Mvc;
using TeleConsult.Api.DTOs;
using TeleConsult.Api.Services;

namespace TeleConsult.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _auth;
    public AuthController(IAuthService auth) => _auth = auth;

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest req)
    {
        try { return Ok(await _auth.LoginAsync(req)); }
        catch (UnauthorizedAccessException) { return Unauthorized(new { message = "用户名或密码错误" }); }
    }
}
