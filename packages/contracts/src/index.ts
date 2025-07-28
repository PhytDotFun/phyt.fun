export const name = 'contracts';

// Re-export contract addresses and ABIs when available
// This will be populated after deployment
export interface ContractAddresses {
    Contract?: string;
}

// Export deployment utilities
export const getContractAddress = (
    addresses: ContractAddresses,
    contractName: keyof ContractAddresses
): string => {
    const address = addresses[contractName];
    if (!address) {
        throw new Error(
            `Contract address not found for ${String(contractName)}`
        );
    }
    return address;
};
