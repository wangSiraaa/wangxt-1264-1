using Microsoft.EntityFrameworkCore;
using TeleConsult.Api.Data;
using TeleConsult.Api.DTOs;

namespace TeleConsult.Api.Services;

public interface IAuthService
{
    Task<LoginResponse> LoginAsync(LoginRequest req);
}

public class AuthService : IAuthService
{
    private readonly AppDbContext _db;
    private readonly AuthTokenService _tokens;

    public AuthService(AppDbContext db, AuthTokenService tokens)
    {
        _db = db;
        _tokens = tokens;
    }

    public async Task<LoginResponse> LoginAsync(LoginRequest req)
    {
        var user = await _db.Users.Include(u => u.Organization)
            .FirstOrDefaultAsync(u => u.Username == req.Username);
        // 演示环境：明文比对；生产环境必须使用 BCrypt/Argon2 校验哈希
        if (user is null || !user.IsActive || user.PasswordHash != req.Password)
            throw new UnauthorizedAccessException("用户名或密码错误");

        var token = _tokens.Issue(user.Id, user.Role, user.FullName, user.OrgId);
        var dto = new UserDto(user.Id, user.Username, user.FullName, user.Role,
            user.Phone, user.OrgId, user.Organization?.Name ?? string.Empty);
        return new LoginResponse(token, dto);
    }
}
