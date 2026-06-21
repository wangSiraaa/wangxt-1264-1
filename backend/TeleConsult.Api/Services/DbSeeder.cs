using Microsoft.EntityFrameworkCore;
using TeleConsult.Api.Data;
using TeleConsult.Api.Models;

namespace TeleConsult.Api.Services;

public static class DbSeeder
{
    public static async Task SeedAsync(AppDbContext db)
    {
        await db.Database.EnsureCreatedAsync();

        if (await db.Organizations.AnyAsync()) return;

        var orgT = new Organization { Id = "org-township-1", Name = "青石乡卫生院", OrgType = "township", Address = "云南省山区青石乡" };
        var orgC = new Organization { Id = "org-county-1", Name = "云岭县人民医院", OrgType = "county", Address = "云南省云岭县城关镇" };
        db.Organizations.AddRange(orgT, orgC);

        db.Users.AddRange(
            new User { Id = "user-doctor-1", Username = "doctor1", PasswordHash = "123456", FullName = "李乡镇", Role = "doctor", Phone = "13800000001", OrgId = orgT.Id },
            new User { Id = "user-expert-1", Username = "expert1", PasswordHash = "123456", FullName = "王主任", Role = "expert", Phone = "13800000002", OrgId = orgC.Id },
            new User { Id = "user-coord-1", Username = "coord1", PasswordHash = "123456", FullName = "赵协调", Role = "coordinator", Phone = "13800000003", OrgId = orgC.Id },
            new User { Id = "user-admin-1", Username = "admin1", PasswordHash = "123456", FullName = "系统管理员", Role = "admin", Phone = "13800000004", OrgId = orgC.Id }
        );

        db.Ambulances.AddRange(
            new Ambulance { Id = "amb-1", PlateNumber = "云L120A", DriverName = "张师傅", Status = "idle", OrgId = orgC.Id },
            new Ambulance { Id = "amb-2", PlateNumber = "云L120B", DriverName = "陈师傅", Status = "idle", OrgId = orgC.Id },
            new Ambulance { Id = "amb-3", PlateNumber = "云L120C", DriverName = "刘师傅", Status = "on_mission", OrgId = orgC.Id }
        );

        db.Beds.AddRange(
            new Bed { Id = "bed-1", BedNumber = "急诊-01", Department = "急诊科", Status = "available", OrgId = orgC.Id },
            new Bed { Id = "bed-2", BedNumber = "急诊-02", Department = "急诊科", Status = "available", OrgId = orgC.Id },
            new Bed { Id = "bed-3", BedNumber = "急诊-03", Department = "急诊科", Status = "occupied", OrgId = orgC.Id },
            new Bed { Id = "bed-4", BedNumber = "心内-01", Department = "心内科", Status = "available", OrgId = orgC.Id },
            new Bed { Id = "bed-5", BedNumber = "心内-02", Department = "心内科", Status = "cleaning", OrgId = orgC.Id },
            new Bed { Id = "bed-6", BedNumber = "ICU-01", Department = "重症监护", Status = "available", OrgId = orgC.Id },
            new Bed { Id = "bed-7", BedNumber = "ICU-02", Department = "重症监护", Status = "occupied", OrgId = orgC.Id }
        );

        await db.SaveChangesAsync();
    }
}
