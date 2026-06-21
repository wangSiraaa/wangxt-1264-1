using System.Security.Claims;
using Microsoft.AspNetCore.Http;

namespace TeleConsult.Api.Services;

public interface ICurrentUserService
{
    TokenPayload? User { get; }
    string? UserId => User?.UserId;
    string? Role => User?.Role;
    string? FullName => User?.FullName;
    string? OrgId => User?.OrgId;
}

public class CurrentUserService : ICurrentUserService
{
    private readonly AuthTokenService _tokens;
    private readonly IHttpContextAccessor _ctx;

    public CurrentUserService(AuthTokenService tokens, IHttpContextAccessor ctx)
    {
        _tokens = tokens;
        _ctx = ctx;
    }

    public TokenPayload? User
    {
        get
        {
            var auth = _ctx.HttpContext?.Request.Headers.Authorization.ToString();
            if (string.IsNullOrEmpty(auth)) return null;
            var token = auth.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase)
                ? auth["Bearer ".Length..] : auth;
            return _tokens.Validate(token);
        }
    }
}
