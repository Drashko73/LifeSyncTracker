using System.Security.Cryptography;
using System.Text;

namespace LifeSyncTracker.API.Services;

/// <summary>
/// Provides AES-256-GCM encryption and decryption for sensitive data.
/// </summary>
public sealed class AesEncryptionService
{
    private readonly byte[] _key;

    public AesEncryptionService(byte[] key)
    {
        if (key.Length != 32)
            throw new ArgumentException("Key must be 256 bits (32 bytes).");
        _key = key;
    }

    /// <summary>
    /// Encrypts plaintext and returns a Base64 string (nonce + ciphertext + tag).
    /// </summary>
    public string Encrypt(string plaintext)
    {
        var plaintextBytes = Encoding.UTF8.GetBytes(plaintext);
        var nonce = new byte[AesGcm.NonceByteSizes.MaxSize]; // 12 bytes
        RandomNumberGenerator.Fill(nonce);

        var ciphertext = new byte[plaintextBytes.Length];
        var tag = new byte[AesGcm.TagByteSizes.MaxSize]; // 16 bytes

        using var aes = new AesGcm(_key, tag.Length);
        aes.Encrypt(nonce, plaintextBytes, ciphertext, tag);

        // nonce (12) + ciphertext (N) + tag (16)
        var result = new byte[nonce.Length + ciphertext.Length + tag.Length];
        nonce.CopyTo(result, 0);
        ciphertext.CopyTo(result, nonce.Length);
        tag.CopyTo(result, nonce.Length + ciphertext.Length);

        return Convert.ToBase64String(result);
    }

    /// <summary>
    /// Decrypts a Base64 string produced by <see cref="Encrypt"/>.
    /// </summary>
    public string Decrypt(string encryptedBase64)
    {
        var data = Convert.FromBase64String(encryptedBase64);

        var nonceSize = AesGcm.NonceByteSizes.MaxSize;
        var tagSize = AesGcm.TagByteSizes.MaxSize;

        var nonce = data[..nonceSize];
        var tag = data[^tagSize..];
        var ciphertext = data[nonceSize..^tagSize];

        var plaintext = new byte[ciphertext.Length];

        using var aes = new AesGcm(_key, tagSize);
        aes.Decrypt(nonce, ciphertext, tag, plaintext);

        return Encoding.UTF8.GetString(plaintext);
    }

    /// <summary>
    /// Computes a deterministic HMAC-SHA256 hash for use as a blind index.
    /// The input is normalized to lowercase to enable case-insensitive lookups.
    /// </summary>
    /// <param name="plaintext">The plaintext value to hash.</param>
    /// <returns>A Base64-encoded HMAC-SHA256 hash.</returns>
    public string ComputeBlindIndex(string plaintext)
    {
        var inputBytes = Encoding.UTF8.GetBytes(plaintext.ToLowerInvariant());
        using var hmac = new HMACSHA256(_key);
        var hash = hmac.ComputeHash(inputBytes);
        return Convert.ToBase64String(hash);
    }
}