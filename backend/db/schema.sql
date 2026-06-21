/* =========================================================================
   山区远程会诊转诊系统 - SQL Server 数据库架构脚本
   适用: SQL Server 2019+ / Azure SQL
   说明: 包含建库、建表、索引、外键与初始数据
   ========================================================================= */

IF DB_ID(N'TeleConsultDb') IS NULL
BEGIN
    CREATE DATABASE TeleConsultDb;
END
GO

USE TeleConsultDb;
GO

/* ------------------------------ 组织机构 ------------------------------ */
IF OBJECT_ID(N'dbo.Organizations', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Organizations (
        Id            NVARCHAR(36)  NOT NULL CONSTRAINT PK_Organizations PRIMARY KEY,
        Name          NVARCHAR(100) NOT NULL,
        OrgType       NVARCHAR(20)  NOT NULL,           -- township / county
        Address       NVARCHAR(200) NULL,
        CreatedAt     DATETIME2      NOT NULL CONSTRAINT DF_Org_CreatedAt DEFAULT SYSDATETIME()
    );
END
GO

/* ------------------------------ 用户 ------------------------------ */
IF OBJECT_ID(N'dbo.Users', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Users (
        Id            NVARCHAR(36)  NOT NULL CONSTRAINT PK_Users PRIMARY KEY,
        Username      NVARCHAR(50)  NOT NULL,
        PasswordHash  NVARCHAR(200) NOT NULL,            -- 生产环境请使用 BCrypt/Argon2
        FullName      NVARCHAR(50)  NOT NULL,
        Role          NVARCHAR(20)  NOT NULL,           -- doctor / expert / coordinator / admin
        Phone         NVARCHAR(20)  NULL,
        OrgId         NVARCHAR(36)  NOT NULL,
        IsActive      BIT            NOT NULL CONSTRAINT DF_Users_Active DEFAULT 1,
        CreatedAt     DATETIME2      NOT NULL CONSTRAINT DF_Users_CreatedAt DEFAULT SYSDATETIME(),
        CONSTRAINT UQ_Users_Username UNIQUE (Username),
        CONSTRAINT FK_Users_Org FOREIGN KEY (OrgId) REFERENCES dbo.Organizations(Id)
    );
END
GO

/* ------------------------------ 病历 ------------------------------ */
IF OBJECT_ID(N'dbo.MedicalRecords', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.MedicalRecords (
        Id              NVARCHAR(36)  NOT NULL CONSTRAINT PK_MedicalRecords PRIMARY KEY,
        PatientName     NVARCHAR(50)  NOT NULL,
        PatientGender   NVARCHAR(10)  NOT NULL,          -- male / female
        PatientAge      INT           NOT NULL,
        PatientPhone    NVARCHAR(20)  NULL,
        ChiefComplaint  NVARCHAR(500) NOT NULL,
        PresentIllness  NVARCHAR(MAX) NULL,
        Temperature     DECIMAL(4,1)  NULL,
        HeartRate       INT           NULL,
        SystolicBP      INT           NULL,
        DiastolicBP     INT           NULL,
        SpO2            INT           NULL,
        IsCritical      BIT            NOT NULL CONSTRAINT DF_Rec_IsCritical DEFAULT 0,
        GreenChannel    BIT            NOT NULL CONSTRAINT DF_Rec_GreenChannel DEFAULT 0,
        ImagingComplete BIT            NOT NULL CONSTRAINT DF_Rec_ImagingComplete DEFAULT 0,
        Status          NVARCHAR(20)  NOT NULL,          -- draft / pending_consult / consulting / transferring / received / closed
        DoctorId        NVARCHAR(36)  NOT NULL,
        DoctorName      NVARCHAR(50)  NOT NULL,
        OrgId           NVARCHAR(36)  NOT NULL,
        CreatedAt      DATETIME2      NOT NULL CONSTRAINT DF_Rec_CreatedAt DEFAULT SYSDATETIME(),
        UpdatedAt      DATETIME2      NULL,
        CONSTRAINT FK_Rec_Doctor FOREIGN KEY (DoctorId) REFERENCES dbo.Users(Id),
        CONSTRAINT FK_Rec_Org FOREIGN KEY (OrgId) REFERENCES dbo.Organizations(Id)
    );
    CREATE INDEX IX_Records_Status ON dbo.MedicalRecords(Status);
    CREATE INDEX IX_Records_GreenChannel ON dbo.MedicalRecords(GreenChannel);
    CREATE INDEX IX_Records_Doctor ON dbo.MedicalRecords(DoctorId);
END
GO

/* ------------------------------ 影像索引 ------------------------------ */
IF OBJECT_ID(N'dbo.ImagingIndexes', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ImagingIndexes (
        Id            NVARCHAR(36)  NOT NULL CONSTRAINT PK_ImagingIndexes PRIMARY KEY,
        RecordId      NVARCHAR(36)  NOT NULL,
        ImagingType   NVARCHAR(20)  NOT NULL,            -- CT / XRay / MRI / Ultrasound
        FileName      NVARCHAR(200) NOT NULL,
        FilePath      NVARCHAR(500) NULL,                -- 实际存储路径/对象存储地址
        UploadedAt    DATETIME2      NOT NULL CONSTRAINT DF_Img_UploadedAt DEFAULT SYSDATETIME(),
        CONSTRAINT FK_Img_Record FOREIGN KEY (RecordId) REFERENCES dbo.MedicalRecords(Id) ON DELETE CASCADE
    );
    CREATE INDEX IX_Images_Record ON dbo.ImagingIndexes(RecordId);
END
GO

/* ------------------------------ 会诊 ------------------------------ */
IF OBJECT_ID(N'dbo.Consultations', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Consultations (
        Id              NVARCHAR(36)  NOT NULL CONSTRAINT PK_Consultations PRIMARY KEY,
        RecordId        NVARCHAR(36)  NOT NULL,
        ExpertId        NVARCHAR(36)  NOT NULL,
        ExpertName      NVARCHAR(50)  NOT NULL,
        Status          NVARCHAR(20)  NOT NULL,          -- pending / completed
        Diagnosis       NVARCHAR(500) NULL,
        Opinion         NVARCHAR(MAX) NULL,
        Recommendation  NVARCHAR(MAX) NULL,
        IsCritical      BIT            NOT NULL CONSTRAINT DF_Cons_IsCritical DEFAULT 0,
        CreatedAt      DATETIME2      NOT NULL CONSTRAINT DF_Cons_CreatedAt DEFAULT SYSDATETIME(),
        CompletedAt    DATETIME2      NULL,
        CONSTRAINT FK_Cons_Record FOREIGN KEY (RecordId) REFERENCES dbo.MedicalRecords(Id),
        CONSTRAINT FK_Cons_Expert FOREIGN KEY (ExpertId) REFERENCES dbo.Users(Id)
    );
    CREATE INDEX IX_Cons_Record ON dbo.Consultations(RecordId);
    CREATE INDEX IX_Cons_Status ON dbo.Consultations(Status);
END
GO

/* ------------------------------ 救护车 ------------------------------ */
IF OBJECT_ID(N'dbo.Ambulances', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Ambulances (
        Id            NVARCHAR(36)  NOT NULL CONSTRAINT PK_Ambulances PRIMARY KEY,
        PlateNumber   NVARCHAR(20)  NOT NULL,
        DriverName    NVARCHAR(50)  NULL,
        Status        NVARCHAR(20)  NOT NULL,            -- idle / on_mission
        OrgId         NVARCHAR(36)  NOT NULL,
        CONSTRAINT UQ_Amb_Plate UNIQUE (PlateNumber),
        CONSTRAINT FK_Amb_Org FOREIGN KEY (OrgId) REFERENCES dbo.Organizations(Id)
    );
END
GO

/* ------------------------------ 床位 ------------------------------ */
IF OBJECT_ID(N'dbo.Beds', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Beds (
        Id            NVARCHAR(36)  NOT NULL CONSTRAINT PK_Beds PRIMARY KEY,
        BedNumber     NVARCHAR(20)  NOT NULL,
        Department    NVARCHAR(50)  NOT NULL,
        Status        NVARCHAR(20)  NOT NULL,            -- available / occupied / cleaning
        OrgId         NVARCHAR(36)  NOT NULL,
        CONSTRAINT UQ_Bed_Number UNIQUE (BedNumber),
        CONSTRAINT FK_Bed_Org FOREIGN KEY (OrgId) REFERENCES dbo.Organizations(Id)
    );
END
GO

/* ------------------------------ 转运 ------------------------------ */
IF OBJECT_ID(N'dbo.Transfers', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Transfers (
        Id              NVARCHAR(36)  NOT NULL CONSTRAINT PK_Transfers PRIMARY KEY,
        RecordId        NVARCHAR(36)  NOT NULL,
        AmbulanceId     NVARCHAR(36)  NULL,
        AmbulancePlate  NVARCHAR(20)  NULL,
        BedId           NVARCHAR(36)  NULL,
        BedNumber       NVARCHAR(20)  NULL,
        Department      NVARCHAR(50)  NULL,
        CoordinatorId   NVARCHAR(36)  NOT NULL,
        CoordinatorName NVARCHAR(50)  NOT NULL,
        PatientName     NVARCHAR(50)  NOT NULL,
        Status          NVARCHAR(20)  NOT NULL,          -- dispatched / in_transit / arrived / received / closed
        GreenChannel    BIT            NOT NULL CONSTRAINT DF_Tr_GreenChannel DEFAULT 0,
        BedChangeRemark NVARCHAR(500) NULL,              -- 床位变更备注
        CreatedAt      DATETIME2      NOT NULL CONSTRAINT DF_Tr_CreatedAt DEFAULT SYSDATETIME(),
        DepartureTime  DATETIME2      NULL,
        ArrivalTime    DATETIME2      NULL,
        CONSTRAINT FK_Tr_Record FOREIGN KEY (RecordId) REFERENCES dbo.MedicalRecords(Id),
        CONSTRAINT FK_Tr_Ambulance FOREIGN KEY (AmbulanceId) REFERENCES dbo.Ambulances(Id),
        CONSTRAINT FK_Tr_Bed FOREIGN KEY (BedId) REFERENCES dbo.Beds(Id),
        CONSTRAINT FK_Tr_Coord FOREIGN KEY (CoordinatorId) REFERENCES dbo.Users(Id)
    );
    CREATE INDEX IX_Transfers_Status ON dbo.Transfers(Status);
    CREATE INDEX IX_Transfers_Record ON dbo.Transfers(RecordId);
END
ELSE
BEGIN
    IF COL_LENGTH(N'dbo.Transfers', N'BedChangeRemark') IS NULL
        ALTER TABLE dbo.Transfers ADD BedChangeRemark NVARCHAR(500) NULL;
END
GO

/* ------------------------------ 转运变更记录 ------------------------------ */
IF OBJECT_ID(N'dbo.TransferChanges', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.TransferChanges (
        Id              NVARCHAR(36)  NOT NULL CONSTRAINT PK_TransferChanges PRIMARY KEY,
        TransferId      NVARCHAR(36)  NOT NULL,
        ChangeType      NVARCHAR(20)  NOT NULL,          -- ambulance / bed / both
        OldAmbulanceId  NVARCHAR(36)  NULL,
        OldAmbulancePlate NVARCHAR(20) NULL,
        NewAmbulanceId  NVARCHAR(36)  NULL,
        NewAmbulancePlate NVARCHAR(20) NULL,
        OldBedId        NVARCHAR(36)  NULL,
        OldBedNumber    NVARCHAR(20)  NULL,
        OldDepartment   NVARCHAR(50)  NULL,
        NewBedId        NVARCHAR(36)  NULL,
        NewBedNumber    NVARCHAR(20)  NULL,
        NewDepartment   NVARCHAR(50)  NULL,
        ChangeReason    NVARCHAR(500) NOT NULL,
        ChangedById     NVARCHAR(36)  NOT NULL,
        ChangedByName   NVARCHAR(50)  NOT NULL,
        CreatedAt      DATETIME2      NOT NULL CONSTRAINT DF_TrCh_CreatedAt DEFAULT SYSDATETIME(),
        CONSTRAINT FK_TrCh_Transfer FOREIGN KEY (TransferId) REFERENCES dbo.Transfers(Id) ON DELETE CASCADE,
        CONSTRAINT FK_TrCh_ChangedBy FOREIGN KEY (ChangedById) REFERENCES dbo.Users(Id)
    );
    CREATE INDEX IX_TransferChanges_Transfer ON dbo.TransferChanges(TransferId);
END
GO

/* ------------------------------ 接诊结果 ------------------------------ */
IF OBJECT_ID(N'dbo.AdmissionResults', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AdmissionResults (
        Id                  NVARCHAR(36)  NOT NULL CONSTRAINT PK_AdmissionResults PRIMARY KEY,
        TransferId          NVARCHAR(36)  NOT NULL,
        AdmissionDiagnosis  NVARCHAR(500) NOT NULL,
        Treatment           NVARCHAR(MAX) NULL,
        Outcome             NVARCHAR(20)  NOT NULL,      -- admitted / transferred_icu / discharged / deceased
        ReceivedById        NVARCHAR(36)  NOT NULL,
        ReceivedByName      NVARCHAR(50)  NOT NULL,
        ReceivedAt         DATETIME2      NOT NULL CONSTRAINT DF_Adm_ReceivedAt DEFAULT SYSDATETIME(),
        CONSTRAINT FK_Adm_Transfer FOREIGN KEY (TransferId) REFERENCES dbo.Transfers(Id),
        CONSTRAINT FK_Adm_User FOREIGN KEY (ReceivedById) REFERENCES dbo.Users(Id)
    );
    CREATE INDEX IX_Admissions_Transfer ON dbo.AdmissionResults(TransferId);
END
GO

/* =========================================================================
   初始数据
   ========================================================================= */
IF NOT EXISTS (SELECT 1 FROM dbo.Organizations)
BEGIN
    INSERT INTO dbo.Organizations (Id, Name, OrgType, Address) VALUES
        (N'org-township-1', N'青石乡卫生院', N'township', N'云南省山区青石乡'),
        (N'org-county-1',   N'云岭县人民医院', N'county',   N'云南省云岭县城关镇');
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.Users)
BEGIN
    -- 注意: PasswordHash 此处为演示明文，生产环境必须替换为哈希值
    INSERT INTO dbo.Users (Id, Username, PasswordHash, FullName, Role, Phone, OrgId) VALUES
        (N'user-doctor-1', N'doctor1',    N'123456', N'李乡镇',   N'doctor',     N'13800000001', N'org-township-1'),
        (N'user-expert-1', N'expert1',    N'123456', N'王主任',   N'expert',      N'13800000002', N'org-county-1'),
        (N'user-coord-1',  N'coord1',     N'123456', N'赵协调',   N'coordinator', N'13800000003', N'org-county-1'),
        (N'user-admin-1',  N'admin1',     N'123456', N'系统管理员', N'admin',     N'13800000004', N'org-county-1');
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.Ambulances)
BEGIN
    INSERT INTO dbo.Ambulances (Id, PlateNumber, DriverName, Status, OrgId) VALUES
        (N'amb-1', N'云L120A', N'张师傅', N'idle',     N'org-county-1'),
        (N'amb-2', N'云L120B', N'陈师傅', N'idle',     N'org-county-1'),
        (N'amb-3', N'云L120C', N'刘师傅', N'on_mission', N'org-county-1');
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.Beds)
BEGIN
    INSERT INTO dbo.Beds (Id, BedNumber, Department, Status, OrgId) VALUES
        (N'bed-1', N'急诊-01', N'急诊科', N'available', N'org-county-1'),
        (N'bed-2', N'急诊-02', N'急诊科', N'available', N'org-county-1'),
        (N'bed-3', N'急诊-03', N'急诊科', N'occupied',  N'org-county-1'),
        (N'bed-4', N'心内-01', N'心内科', N'available', N'org-county-1'),
        (N'bed-5', N'心内-02', N'心内科', N'cleaning',  N'org-county-1'),
        (N'bed-6', N'ICU-01',  N'重症监护', N'available', N'org-county-1'),
        (N'bed-7', N'ICU-02',  N'重症监护', N'occupied',  N'org-county-1');
END
GO

PRINT N'TeleConsultDb 架构与初始数据初始化完成。';
GO
