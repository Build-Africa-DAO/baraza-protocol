// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import { IERC721 } from "../lib/interfaces/IERC721.sol";
import { IToken } from "../token/IToken.sol";
import { Manager } from "../manager/Manager.sol";
import { IOwnable } from "../lib/interfaces/IOwnable.sol";
import { IProtocolRewards } from "../lib/interfaces/IProtocolRewards.sol";
import { ReentrancyGuard } from "../lib/utils/ReentrancyGuard.sol";

/// @title ERC721RedeemMinter
/// @notice A mint strategy that allows ERC721 token holders to redeem DAO tokens
/// @author @neokry
contract ERC721RedeemMinter is ReentrancyGuard {
    ///                                                          ///
    ///                            EVENTS                        ///
    ///                                                          ///

    /// @notice Event for mint settings updated
    event MinterSet(address indexed tokenContract, RedeemSettings redeemSettings);

    ///                                                          ///
    ///                            ERRORS                        ///
    ///                                                          ///

    /// @dev Caller is not the owner of the specified token contract
    error NOT_TOKEN_OWNER();

    /// @dev Transfer failed
    error TRANSFER_FAILED();

    /// @dev Mint has ended
    error MINT_ENDED();

    /// @dev Mint has not started
    error MINT_NOT_STARTED();

    /// @dev Value sent does not match total fee value
    error INVALID_VALUE();

    /// @dev Invalid amount of tokens to claim
    error INVALID_TOKEN_COUNT();

    /// @dev Redeem token has not been minted yet
    error NOT_MINTED();

    /// @dev Token has already been redeemed
    error ALREADY_REDEEMED();

    /// @dev Invalid settings configuration
    error INVALID_SETTINGS();

    /// @dev Could not mint token
    error ERROR_MINTING_TOKEN(uint256 tokenId);

    /// @dev No tokens could be minted
    error NO_TOKENS_MINTED();

    ///                                                          ///
    ///                            STRUCTS                       ///
    ///                                                          ///

    /// @notice General redeem plus settings
    struct RedeemSettings {
        /// @notice Unix timestamp for the mint start
        uint64 mintStart;
        /// @notice Unix timestamp for the mint end
        uint64 mintEnd;
        /// @notice Price per token
        uint64 pricePerToken;
        /// @notice Redemption token
        address redeemToken;
    }

    ///                                                          ///
    ///                            CONSTANTS                     ///
    ///                                                          ///

    /// @notice Per token mint fee sent to BarazaDAO
    uint256 public constant BUILDER_DAO_FEE = 0.000777 ether;

    ///                                                          ///
    ///                            IMMUTABLES                    ///
    ///                                                          ///

    /// @notice Manager contract
    Manager immutable manager;

    /// @notice Protocol rewards contract
    IProtocolRewards immutable protocolRewards;

    ///                                                          ///
    ///                            STORAGE                       ///
    ///                                                          ///

    /// @notice Stores the redeem settings for a token
    mapping(address => RedeemSettings) public redeemSettings;

    /// @notice Tracks which tokenIds have been redeemed for each token contract
    mapping(address => mapping(uint256 => bool)) public redeemed;

    ///                                                          ///
    ///                            MODIFIERS                     ///
    ///                                                          ///

    /// @notice Checks if the caller is the token contract or the owner of the token contract
    /// @param tokenContract Token contract to check
    modifier onlyContractOwner(address tokenContract) {
        // Revert if sender is not the token contract owner
        if (!_isContractOwner(msg.sender, tokenContract)) {
            revert NOT_TOKEN_OWNER();
        }
        _;
    }

    ///                                                          ///
    ///                          CONSTRUCTOR                     ///
    ///                                                          ///

    constructor(Manager _manager, address _protocolRewards) {
        manager = _manager;
        protocolRewards = IProtocolRewards(_protocolRewards);
    }

    ///                                                          ///
    ///                            MINT                          ///
    ///                                                          ///

    /// @notice gets the total fees for minting
    function getTotalFeesForMint(address tokenContract, uint256 quantity) public view returns (uint256) {
        return _getTotalFeesForMint(redeemSettings[tokenContract].pricePerToken, quantity);
    }

    /// @notice Mints reserved tokens to holders of a specified ERC721 collection
    /// @param tokenContract The DAO token contract to mint from
    /// @param tokenIds List of tokenIds from the redeemToken collection
    function mintFromReserve(address tokenContract, uint256[] calldata tokenIds) public payable nonReentrant {
        // Load settings from storage
        RedeemSettings memory settings = redeemSettings[tokenContract];

        // Cache token count
        uint256 tokenCount = tokenIds.length;

        // Validate params
        _validateParams(settings, tokenCount);

        uint256 mintCount;

        unchecked {
            for (uint256 i = 0; i < tokenCount; ++i) {
                uint256 tokenId = tokenIds[i];

                // Check if already redeemed
                if (redeemed[tokenContract][tokenId]) {
                    revert ALREADY_REDEEMED();
                }

                // Check ownership of redeem token
                address owner = _ownerOfRedeemToken(settings.redeemToken, tokenId);

                // Cannot redeem a token that has not been minted
                if (owner == address(0)) {
                    revert NOT_MINTED();
                }

                // Mark as redeemed
                redeemed[tokenContract][tokenId] = true;

                // Only allowing reserved tokens to be minted for this strategy
                try IToken(tokenContract).mintFromReserveTo(owner, tokenId) {
                    // Track mint count to ensure at least one token is minted
                    mintCount++;
                } catch {
                    // we don't want to handle refunds so revert if user is paying for tokens and a token is already minted
                    // if a user is not paying for tokens ignore the error and allow them to continue minting
                    if (settings.pricePerToken > 0) {
                        revert ERROR_MINTING_TOKEN(tokenId);
                    }
                }
            }
        }

        // Revert if no tokens were minted
        if (mintCount == 0) {
            revert NO_TOKENS_MINTED();
        }

        // Distribute fees if minting fees for this collection are set (Baraza DAO fee does not apply to free mints)
        if (settings.pricePerToken > 0) {
            _distributeFees(tokenContract, tokenCount);
        }
    }

    function _validateParams(RedeemSettings memory settings, uint256 tokenCount) internal view {
        // Check sale end
        if (block.timestamp > settings.mintEnd) {
            revert MINT_ENDED();
        }

        // Check sale start
        if (block.timestamp < settings.mintStart) {
            revert MINT_NOT_STARTED();
        }

        // Require at least one token claim
        if (tokenCount < 1) {
            revert INVALID_TOKEN_COUNT();
        }

        // Check value sent - must be exact amount
        if (msg.value != _getTotalFeesForMint(settings.pricePerToken, tokenCount)) {
            revert INVALID_VALUE();
        }
    }

    function _ownerOfRedeemToken(address redeemToken, uint256 tokenId) internal view returns (address) {
        // Check redeem token owner or return address(0) if it doesn't exist
        try IERC721(redeemToken).ownerOf(tokenId) returns (address redeemOwner) {
            return redeemOwner;
        } catch {
            return address(0);
        }
    }

    ///                                                          ///
    ///                            FEES                          ///
    ///                                                          ///

    function _getTotalFeesForMint(uint256 pricePerToken, uint256 quantity) internal pure returns (uint256) {
        // If pricePerToken is 0 the mint has no Baraza DAO fee
        return pricePerToken > 0 ? quantity * (pricePerToken + BUILDER_DAO_FEE) : 0;
    }

    function _distributeFees(address tokenContract, uint256 quantity) internal {
        uint256 barazaFee = quantity * BUILDER_DAO_FEE;
        uint256 value = msg.value;

        (,, address treasury,) = manager.getAddresses(tokenContract);
        address barazaRecipient = manager.barazaRewardsRecipient();

        // Pay out fees to the Baraza DAO
        protocolRewards.deposit{ value: barazaFee }(barazaRecipient, hex"00", "");

        // Pay out remaining funds to the treasury
        if (value > barazaFee) {
            (bool treasurySuccess,) = treasury.call{ value: value - barazaFee }("");

            // Revert if treasury cannot accept funds
            if (!treasurySuccess) {
                revert TRANSFER_FAILED();
            }
        }
    }

    ///                                                          ///
    ///                            SETTINGS                      ///
    ///                                                          ///

    /// @notice Sets the minter settings for a token
    /// @param tokenContract Token contract to set settings for
    /// @param settings Settings to set
    function setMintSettings(address tokenContract, RedeemSettings memory settings) external onlyContractOwner(tokenContract) {
        // Set new collection settings
        _setMintSettings(tokenContract, settings);

        // Emit event for new settings
        emit MinterSet(tokenContract, settings);
    }

    /// @notice Resets the minter settings for a token
    /// @param tokenContract Token contract to reset settings for
    function resetMintSettings(address tokenContract) external onlyContractOwner(tokenContract) {
        // Reset collection settings to null
        delete redeemSettings[tokenContract];

        // Emit event with null settings
        emit MinterSet(tokenContract, redeemSettings[tokenContract]);
    }

    function _setMintSettings(address tokenContract, RedeemSettings memory settings) internal {
        // Validate settings
        if (settings.mintEnd <= settings.mintStart) {
            revert INVALID_SETTINGS();
        }

        if (settings.mintEnd <= block.timestamp) {
            revert INVALID_SETTINGS();
        }

        if (settings.redeemToken == address(0)) {
            revert INVALID_SETTINGS();
        }

        if (settings.redeemToken == tokenContract) {
            revert INVALID_SETTINGS();
        }

        redeemSettings[tokenContract] = settings;
    }

    function _isContractOwner(address caller, address tokenContract) internal view returns (bool) {
        return IOwnable(tokenContract).owner() == caller;
    }
}
