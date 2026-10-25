using CrystalPharm.Prescriptions.Domain.Entities;

namespace CrystalPharm.Prescriptions.Domain.ValueObjects;

/// <summary>Ce qu'on sait d'un fichier reçu avant de le garder : sa nature, son format reconnu et sa taille.</summary>
public sealed record DocumentDraft(DocumentKind Kind, DocumentFormat Format, long SizeInBytes);
