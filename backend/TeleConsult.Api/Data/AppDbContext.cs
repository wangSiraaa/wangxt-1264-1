using Microsoft.EntityFrameworkCore;
using TeleConsult.Api.Models;

namespace TeleConsult.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Organization> Organizations => Set<Organization>();
    public DbSet<User> Users => Set<User>();
    public DbSet<MedicalRecord> MedicalRecords => Set<MedicalRecord>();
    public DbSet<ImagingIndex> ImagingIndexes => Set<ImagingIndex>();
    public DbSet<Consultation> Consultations => Set<Consultation>();
    public DbSet<Ambulance> Ambulances => Set<Ambulance>();
    public DbSet<Bed> Beds => Set<Bed>();
    public DbSet<Transfer> Transfers => Set<Transfer>();
    public DbSet<TransferChange> TransferChanges => Set<TransferChange>();
    public DbSet<AdmissionResult> AdmissionResults => Set<AdmissionResult>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<User>(e =>
        {
            e.HasIndex(u => u.Username).IsUnique();
            e.HasOne(u => u.Organization)
             .WithMany().HasForeignKey(u => u.OrgId).OnDelete(DeleteBehavior.Restrict);
        });

        b.Entity<MedicalRecord>(e =>
        {
            e.HasIndex(r => r.Status);
            e.HasIndex(r => r.GreenChannel);
            e.HasIndex(r => r.DoctorId);
            e.HasOne(r => r.Doctor).WithMany().HasForeignKey(r => r.DoctorId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(r => r.Organization).WithMany().HasForeignKey(r => r.OrgId).OnDelete(DeleteBehavior.Restrict);
        });

        b.Entity<ImagingIndex>(e =>
        {
            e.HasIndex(i => i.RecordId);
            e.HasOne(i => i.Record).WithMany(r => r.Images)
             .HasForeignKey(i => i.RecordId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<Consultation>(e =>
        {
            e.HasIndex(c => c.RecordId);
            e.HasIndex(c => c.Status);
            e.HasOne(c => c.Record).WithMany(r => r.Consultations)
             .HasForeignKey(c => c.RecordId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(c => c.Expert).WithMany().HasForeignKey(c => c.ExpertId).OnDelete(DeleteBehavior.Restrict);
        });

        b.Entity<Ambulance>(e =>
        {
            e.HasIndex(a => a.PlateNumber).IsUnique();
            e.HasOne(a => a.Organization).WithMany().HasForeignKey(a => a.OrgId).OnDelete(DeleteBehavior.Restrict);
        });

        b.Entity<Bed>(e =>
        {
            e.HasIndex(bed => bed.BedNumber).IsUnique();
            e.HasOne(bed => bed.Organization).WithMany().HasForeignKey(bed => bed.OrgId).OnDelete(DeleteBehavior.Restrict);
        });

        b.Entity<Transfer>(e =>
        {
            e.HasIndex(t => t.Status);
            e.HasIndex(t => t.RecordId);
            e.HasOne(t => t.Record).WithMany().HasForeignKey(t => t.RecordId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(t => t.Ambulance).WithMany().HasForeignKey(t => t.AmbulanceId).OnDelete(DeleteBehavior.SetNull);
            e.HasOne(t => t.Bed).WithMany().HasForeignKey(t => t.BedId).OnDelete(DeleteBehavior.SetNull);
            e.HasOne(t => t.Coordinator).WithMany().HasForeignKey(t => t.CoordinatorId).OnDelete(DeleteBehavior.Restrict);
            e.HasMany(t => t.Changes).WithOne(c => c.Transfer).HasForeignKey(c => c.TransferId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<TransferChange>(e =>
        {
            e.HasIndex(c => c.TransferId);
            e.HasOne(c => c.Transfer).WithMany(t => t.Changes).HasForeignKey(c => c.TransferId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(c => c.ChangedBy).WithMany().HasForeignKey(c => c.ChangedById).OnDelete(DeleteBehavior.Restrict);
        });

        b.Entity<AdmissionResult>(e =>
        {
            e.HasIndex(a => a.TransferId);
            e.HasOne(a => a.Transfer).WithOne(t => t.AdmissionResult)
             .HasForeignKey<AdmissionResult>(a => a.TransferId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(a => a.ReceivedBy).WithMany().HasForeignKey(a => a.ReceivedById).OnDelete(DeleteBehavior.Restrict);
        });
    }
}
