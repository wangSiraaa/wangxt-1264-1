using System.ComponentModel.DataAnnotations;

namespace TeleConsult.Api.Models;

public class Organization
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string Name { get; set; } = default!;
    public string OrgType { get; set; } = default!; // township / county
    public string? Address { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class User
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string Username { get; set; } = default!;
    public string PasswordHash { get; set; } = default!;
    public string FullName { get; set; } = default!;
    public string Role { get; set; } = default!; // doctor / expert / coordinator / admin
    public string? Phone { get; set; }
    public string OrgId { get; set; } = default!;
    public Organization? Organization { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class MedicalRecord
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string PatientName { get; set; } = default!;
    public string PatientGender { get; set; } = default!; // male / female
    public int PatientAge { get; set; }
    public string? PatientPhone { get; set; }
    public string ChiefComplaint { get; set; } = default!;
    public string? PresentIllness { get; set; }

    public decimal? Temperature { get; set; }
    public int? HeartRate { get; set; }
    public int? SystolicBP { get; set; }
    public int? DiastolicBP { get; set; }
    public int? SpO2 { get; set; }

    public bool IsCritical { get; set; }
    public bool GreenChannel { get; set; }
    public bool ImagingComplete { get; set; }

    public string Status { get; set; } = "draft"; // draft / pending_consult / consulting / transferring / received / closed
    public string DoctorId { get; set; } = default!;
    public string DoctorName { get; set; } = default!;
    public string OrgId { get; set; } = default!;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public User? Doctor { get; set; }
    public Organization? Organization { get; set; }
    public List<ImagingIndex> Images { get; set; } = new();
    public List<Consultation> Consultations { get; set; } = new();
}

public class ImagingIndex
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string RecordId { get; set; } = default!;
    public string ImagingType { get; set; } = default!; // CT / XRay / MRI / Ultrasound
    public string FileName { get; set; } = default!;
    public string? FilePath { get; set; }
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

    public MedicalRecord? Record { get; set; }
}

public class Consultation
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string RecordId { get; set; } = default!;
    public string ExpertId { get; set; } = default!;
    public string ExpertName { get; set; } = default!;
    public string Status { get; set; } = "pending"; // pending / completed
    public string? Diagnosis { get; set; }
    public string? Opinion { get; set; }
    public string? Recommendation { get; set; }
    public bool IsCritical { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }

    public MedicalRecord? Record { get; set; }
    public User? Expert { get; set; }
}

public class Ambulance
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string PlateNumber { get; set; } = default!;
    public string? DriverName { get; set; }
    public string Status { get; set; } = "idle"; // idle / on_mission
    public string OrgId { get; set; } = default!;
    public Organization? Organization { get; set; }
}

public class Bed
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string BedNumber { get; set; } = default!;
    public string Department { get; set; } = default!;
    public string Status { get; set; } = "available"; // available / occupied / cleaning
    public string OrgId { get; set; } = default!;
    public Organization? Organization { get; set; }
}

public class Transfer
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string RecordId { get; set; } = default!;
    public string? AmbulanceId { get; set; }
    public string? AmbulancePlate { get; set; }
    public string? BedId { get; set; }
    public string? BedNumber { get; set; }
    public string? Department { get; set; }
    public string CoordinatorId { get; set; } = default!;
    public string CoordinatorName { get; set; } = default!;
    public string PatientName { get; set; } = default!;
    public string Status { get; set; } = "dispatched"; // dispatched / in_transit / arrived / received / closed
    public bool GreenChannel { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? DepartureTime { get; set; }
    public DateTime? ArrivalTime { get; set; }

    public MedicalRecord? Record { get; set; }
    public Ambulance? Ambulance { get; set; }
    public Bed? Bed { get; set; }
    public User? Coordinator { get; set; }
    public AdmissionResult? AdmissionResult { get; set; }
}

public class AdmissionResult
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string TransferId { get; set; } = default!;
    public string AdmissionDiagnosis { get; set; } = default!;
    public string? Treatment { get; set; }
    public string Outcome { get; set; } = default!; // admitted / transferred_icu / discharged / deceased
    public string ReceivedById { get; set; } = default!;
    public string ReceivedByName { get; set; } = default!;
    public DateTime ReceivedAt { get; set; } = DateTime.UtcNow;

    public Transfer? Transfer { get; set; }
    public User? ReceivedBy { get; set; }
}
