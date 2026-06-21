namespace TeleConsult.Api.DTOs;

public record LoginRequest(string Username, string Password);
public record LoginResponse(string Token, UserDto User);
public record UserDto(string Id, string Username, string FullName, string Role, string? Phone, string OrgId, string OrgName);

public record CreateRecordRequest(
    string PatientName, string PatientGender, int PatientAge, string? PatientPhone,
    string ChiefComplaint, string? PresentIllness,
    decimal? Temperature, int? HeartRate, int? SystolicBP, int? DiastolicBP, int? SpO2,
    bool IsCritical);

public record UploadImageRequest(string ImagingType, string FileName);
public record CompleteConsultationRequest(string Diagnosis, string Opinion, string Recommendation, bool IsCritical);
public record CreateTransferRequest(string RecordId, string AmbulanceId, string BedId, string? BedChangeRemark);
public record UpdateTransferStatusRequest(string Status);
public record AdjustTransferRequest(string? AmbulanceId, string? BedId, string ChangeReason);
public record TransferChangeDto(
    string Id,
    string TransferId,
    string ChangeType,
    string? OldAmbulancePlate,
    string? NewAmbulancePlate,
    string? OldBedInfo,
    string? NewBedInfo,
    string ChangeReason,
    string ChangedByName,
    DateTime CreatedAt);
public record CreateAdmissionRequest(string TransferId, string AdmissionDiagnosis, string? Treatment, string Outcome);
public record DashboardStatsDto(
    int PendingConsult, int Consulting, int InTransit,
    int GreenChannelActive, int CompletedToday, int AvailableBeds);
