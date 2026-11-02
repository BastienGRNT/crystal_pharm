using CrystalPharm.Prescriptions.Domain.Entities;

namespace CrystalPharm.Prescriptions.Application.Dtos;

/// <param name="ExpectedProductsOn">Seulement pour <see cref="PrescriptionStatus.WaitingForProducts"/> ; ignoré sinon.</param>
public sealed record PrescriptionStatusChangeDto(PrescriptionStatus Status, DateOnly? ExpectedProductsOn);

public sealed record PrescriptionTeamNoteDto(string? Note);
