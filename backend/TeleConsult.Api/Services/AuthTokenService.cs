using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace TeleConsult.Api.Services;

public record TokenPayload(string UserId, string Role, string FullName, string OrgId, DateTime ExpiresAt);

public class AuthTokenService
{
    private readonly byte[] _key;
    private readonly int _expireMinutes;

    public AuthTokenService(IConfiguration cfg)
    {
        _key = Encoding.UTF8.GetBytes(cfg["Jwt:SecretKey"]
            ?? throw new InvalidOperationException("Jwt:SecretKey 未配置"));
        _expireMinutes = cfg.GetValue("Jwt:ExpireMinutes", 720);
    }

    public string Issue(string userId, string role, string fullName, string orgId)
    {
        var payload = new TokenPayload(userId, role, fullName, orgId,
            DateTime.UtcNow.AddMinutes(_expireMinutes));
        var json = JsonSerializer.Serialize(payload);
        var body = Base64Url(Encoding.UTF8.GetBytes(json));
        var sig = Base64Url(HMACSHA256.HashData(_key, Encoding.UTF8.GetBytes(body)));
        return $"{body}.{sig}";
    }

    public TokenPayload? Validate(string? token)
    {
        if (string.IsNullOrWhiteSpace(token)) return null;
        var parts = token.Split('.');
        if (parts.Length != 2) return null;
        var body = parts[0];
        var sig = parts[1];
        var expected = Base64Url(HMACSHA256.HashData(_key, Encoding.UTF8.GetBytes(body)));
        if (!CryptographicOperations.FixedTimeEquals(
                Encoding.UTF8.GetBytes(sig), Encoding.UTF8.GetBytes(expected)))
            return null;
        try
        {
            var json = Encoding.UTF8.GetString(Base64UrlDecode(body));
            var payload = JsonSerializer.Deserialize<TokenPayload>(json);
            if (payload is null || payload.ExpiresAt < DateTime.UtcNow) return null;
            return payload;
        }
        catch { return null; }
    }

    private static string Base64Url(byte[] data) =>
        Convert.ToBase64String(data).TrimEnd('=').Replace('+', '-').Replace('/', '_');

    private static byte[] Base64UrlDecode(string s)
    {
        s = s.Replace('-', '+').Replace('_', '/');
        s = s.PadRight(s.Length + (4 - s.Length % 4) % 4, '=');
        return Convert.FromBase64String(s);
    }
}
