using System.Security.Claims;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Options;

namespace TeleConsult.Api.Services;

public class TeleConsultAuthHandler : AuthenticationHandler<AuthenticationSchemeOptions>
{
    private readonly AuthTokenService _tokens;

    public TeleConsultAuthHandler(
        IOptionsMonitor<AuthenticationSchemeOptions> options,
        ILoggerFactory logger,
        UrlEncoder encoder,
        AuthTokenService tokens)
        : base(options, logger, encoder) => _tokens = tokens;

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        var auth = Request.Headers.Authorization.ToString();
        if (string.IsNullOrEmpty(auth) || !auth.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
            return Task.FromResult(AuthenticateResult.NoResult());

        var token = auth["Bearer ".Length..];
        var payload = _tokens.Validate(token);
        if (payload is null)
            return Task.FromResult(AuthenticateResult.Fail("无效或过期的令牌"));

        var identity = new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, payload.UserId),
            new Claim(ClaimTypes.Name, payload.FullName),
            new Claim(ClaimTypes.Role, payload.Role),
            new Claim("org_id", payload.OrgId),
        }, Scheme.Name);

        var principal = new ClaimsPrincipal(identity);
        var ticket = new AuthenticationTicket(principal, Scheme.Name);
        return Task.FromResult(AuthenticateResult.Success(ticket));
    }
}
