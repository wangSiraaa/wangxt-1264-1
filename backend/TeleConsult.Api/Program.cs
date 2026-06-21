using Microsoft.AspNetCore.Authentication;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using TeleConsult.Api.Data;
using TeleConsult.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// ---- 数据库 ----
builder.Services.AddDbContext<AppDbContext>(opt =>
    opt.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// ---- 认证: 自定义 Bearer Token ----
builder.Services.AddSingleton<AuthTokenService>();
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();
builder.Services.AddAuthentication("TeleConsultScheme")
    .AddScheme<AuthenticationSchemeOptions, TeleConsultAuthHandler>("TeleConsultScheme", _ => { });

// ---- 业务服务 ----
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IRecordService, RecordService>();
builder.Services.AddScoped<IConsultationService, ConsultationService>();
builder.Services.AddScoped<ITransferService, TransferService>();
builder.Services.AddScoped<IAdmissionService, AdmissionService>();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// ---- Swagger ----
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "山区远程会诊转诊 API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "请在下方输入登录获取的 Token",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer",
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme { Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" } },
            Array.Empty<string>()
        }
    });
});

// ---- CORS ----
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? new[] { "http://localhost:5173" };
builder.Services.AddCors(o => o.AddPolicy("web", p =>
    p.WithOrigins(allowedOrigins).AllowAnyHeader().AllowAnyMethod().AllowCredentials()));

var app = builder.Build();

// ---- 初始化数据库 ----
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    try { await DbSeeder.SeedAsync(db); }
    catch (Exception ex) { app.Logger.LogWarning(ex, "数据库初始化失败，请检查连接字符串与 SQL Server 是否可用"); }
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("web");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
