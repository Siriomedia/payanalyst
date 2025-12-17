export function firebaseUidToUuid(firebaseUid: string): string {
    const hexString = Array.from(firebaseUid)
        .map(char => char.charCodeAt(0).toString(16).padStart(2, '0'))
        .join('')
        .slice(0, 32);

    const paddedHex = hexString.padEnd(32, '0');

    return [
        paddedHex.slice(0, 8),
        paddedHex.slice(8, 12),
        paddedHex.slice(12, 16),
        paddedHex.slice(16, 20),
        paddedHex.slice(20, 32)
    ].join('-');
}
