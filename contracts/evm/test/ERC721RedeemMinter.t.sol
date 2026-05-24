// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import { BarazaTest } from "./utils/BarazaTest.sol";
import { MockERC721 } from "./utils/mocks/MockERC721.sol";
import { ERC721RedeemMinter } from "../src/minters/ERC721RedeemMinter.sol";
import { TokenTypesV2 } from "../src/token/types/TokenTypesV2.sol";

contract ERC721RedeemMinterTest is BarazaTest {
    ERC721RedeemMinter public minter;

    address internal claimer1;
    address internal claimer2;

    MockERC721 public redeemToken;

    function setUp() public virtual override {
        super.setUp();

        minter = new ERC721RedeemMinter(manager, rewards);
        redeemToken = new MockERC721();

        claimer1 = address(0xC1);
        claimer2 = address(0xC2);
    }

    function deployAltMockAndSetMinter(uint256 _reservedUntilTokenId, address _minter, ERC721RedeemMinter.RedeemSettings memory _settings)
        internal
        virtual
    {
        setMockFounderParams();

        setMockTokenParamsWithReserve(_reservedUntilTokenId);

        setMockAuctionParams();

        setMockGovParams();

        deploy(foundersArr, tokenParams, auctionParams, govParams);

        setMockMetadata();

        TokenTypesV2.MinterParams[] memory minters = new TokenTypesV2.MinterParams[](1);
        minters[0] = TokenTypesV2.MinterParams({ minter: address(_minter), allowed: true });

        vm.startPrank(token.owner());
        token.updateMinters(minters);
        ERC721RedeemMinter(_minter).setMintSettings(address(token), _settings);
        vm.stopPrank();
    }

    function test_MintFlow() public {
        ERC721RedeemMinter.RedeemSettings memory settings = ERC721RedeemMinter.RedeemSettings({
            mintStart: 0,
            mintEnd: uint64(block.timestamp + 1000),
            pricePerToken: 0 ether,
            redeemToken: address(redeemToken)
        });

        deployAltMockAndSetMinter(20, address(minter), settings);

        (uint64 mintStart, uint64 mintEnd, uint64 pricePerToken, address redeem) = minter.redeemSettings(address(token));
        assertEq(mintStart, settings.mintStart);
        assertEq(mintEnd, settings.mintEnd);
        assertEq(pricePerToken, settings.pricePerToken);
        assertEq(redeem, settings.redeemToken);

        redeemToken.mint(claimer1, 4);

        uint256[] memory tokenIds = new uint256[](1);
        tokenIds[0] = 4;

        minter.mintFromReserve(address(token), tokenIds);

        assertEq(token.ownerOf(4), claimer1);
    }

    function test_MintFlowMutliple() public {
        ERC721RedeemMinter.RedeemSettings memory settings = ERC721RedeemMinter.RedeemSettings({
            mintStart: 0,
            mintEnd: uint64(block.timestamp + 1000),
            pricePerToken: 0 ether,
            redeemToken: address(redeemToken)
        });

        deployAltMockAndSetMinter(20, address(minter), settings);

        redeemToken.mint(claimer1, 4);
        redeemToken.mint(claimer1, 5);
        redeemToken.mint(claimer1, 6);

        uint256[] memory tokenIds = new uint256[](3);
        tokenIds[0] = 4;
        tokenIds[1] = 5;
        tokenIds[2] = 6;

        minter.mintFromReserve(address(token), tokenIds);

        assertEq(token.ownerOf(4), claimer1);
        assertEq(token.ownerOf(5), claimer1);
        assertEq(token.ownerOf(6), claimer1);
    }

    function testRevert_NotMinted() public {
        ERC721RedeemMinter.RedeemSettings memory settings = ERC721RedeemMinter.RedeemSettings({
            mintStart: 0,
            mintEnd: uint64(block.timestamp + 1000),
            pricePerToken: 0 ether,
            redeemToken: address(redeemToken)
        });

        deployAltMockAndSetMinter(20, address(minter), settings);

        uint256[] memory tokenIds = new uint256[](1);
        tokenIds[0] = 4;

        vm.expectRevert(abi.encodeWithSignature("NOT_MINTED()"));
        minter.mintFromReserve(address(token), tokenIds);
    }

    function test_MintFlowWithValue() public {
        ERC721RedeemMinter.RedeemSettings memory settings = ERC721RedeemMinter.RedeemSettings({
            mintStart: 0,
            mintEnd: uint64(block.timestamp + 1000),
            pricePerToken: 0.01 ether,
            redeemToken: address(redeemToken)
        });

        deployAltMockAndSetMinter(20, address(minter), settings);

        redeemToken.mint(claimer1, 4);

        uint256[] memory tokenIds = new uint256[](1);
        tokenIds[0] = 4;

        vm.deal(claimer1, 10 ether);

        uint256 balanceBefore = claimer1.balance;
        uint256 totalFees = minter.getTotalFeesForMint(address(token), 1);

        vm.prank(claimer1);
        minter.mintFromReserve{ value: totalFees }(address(token), tokenIds);

        assertEq(balanceBefore - totalFees, claimer1.balance);
        assertEq(token.ownerOf(4), claimer1);
    }

    function test_MintFlowWithValueMultiple() public {
        ERC721RedeemMinter.RedeemSettings memory settings = ERC721RedeemMinter.RedeemSettings({
            mintStart: 0,
            mintEnd: uint64(block.timestamp + 1000),
            pricePerToken: 0.01 ether,
            redeemToken: address(redeemToken)
        });

        deployAltMockAndSetMinter(20, address(minter), settings);

        redeemToken.mint(claimer1, 4);
        redeemToken.mint(claimer1, 5);
        redeemToken.mint(claimer1, 6);

        uint256[] memory tokenIds = new uint256[](3);
        tokenIds[0] = 4;
        tokenIds[1] = 5;
        tokenIds[2] = 6;

        vm.deal(claimer1, 10 ether);

        uint256 balanceBefore = claimer1.balance;
        uint256 totalFees = minter.getTotalFeesForMint(address(token), 3);

        vm.prank(claimer1);
        minter.mintFromReserve{ value: totalFees }(address(token), tokenIds);

        assertEq(balanceBefore - totalFees, claimer1.balance);
        assertEq(token.ownerOf(4), claimer1);
        assertEq(token.ownerOf(5), claimer1);
        assertEq(token.ownerOf(6), claimer1);
    }

    function testRevert_MintFlowInvalidValue() public {
        ERC721RedeemMinter.RedeemSettings memory settings = ERC721RedeemMinter.RedeemSettings({
            mintStart: 0,
            mintEnd: uint64(block.timestamp + 1000),
            pricePerToken: 0.01 ether,
            redeemToken: address(redeemToken)
        });

        deployAltMockAndSetMinter(20, address(minter), settings);

        redeemToken.mint(claimer1, 4);
        redeemToken.mint(claimer1, 5);
        redeemToken.mint(claimer1, 6);

        uint256[] memory tokenIds = new uint256[](3);
        tokenIds[0] = 4;
        tokenIds[1] = 5;
        tokenIds[2] = 6;

        vm.deal(claimer1, 10 ether);
        vm.prank(claimer1);
        vm.expectRevert(abi.encodeWithSignature("INVALID_VALUE()"));
        minter.mintFromReserve{ value: 0 }(address(token), tokenIds);
    }

    function testRevert_MintNotStarted() public {
        ERC721RedeemMinter.RedeemSettings memory settings = ERC721RedeemMinter.RedeemSettings({
            mintStart: uint64(block.timestamp + 999),
            mintEnd: uint64(block.timestamp + 1000),
            pricePerToken: 0 ether,
            redeemToken: address(redeemToken)
        });

        deployAltMockAndSetMinter(20, address(minter), settings);

        redeemToken.mint(claimer1, 4);

        uint256[] memory tokenIds = new uint256[](1);
        tokenIds[0] = 4;

        vm.expectRevert(abi.encodeWithSignature("MINT_NOT_STARTED()"));
        minter.mintFromReserve(address(token), tokenIds);
    }

    function testRevert_MintEnded() public {
        ERC721RedeemMinter.RedeemSettings memory settings = ERC721RedeemMinter.RedeemSettings({
            mintStart: uint64(block.timestamp),
            mintEnd: uint64(block.timestamp + 100),
            pricePerToken: 0 ether,
            redeemToken: address(redeemToken)
        });

        deployAltMockAndSetMinter(20, address(minter), settings);

        redeemToken.mint(claimer1, 4);

        uint256[] memory tokenIds = new uint256[](1);
        tokenIds[0] = 4;

        // Warp to after mint ends
        vm.warp(block.timestamp + 101);

        vm.expectRevert(abi.encodeWithSignature("MINT_ENDED()"));
        minter.mintFromReserve(address(token), tokenIds);
    }

    function test_ResetMint() public {
        ERC721RedeemMinter.RedeemSettings memory settings = ERC721RedeemMinter.RedeemSettings({
            mintStart: uint64(0),
            mintEnd: uint64(block.timestamp + 100),
            pricePerToken: 0 ether,
            redeemToken: address(redeemToken)
        });

        deployAltMockAndSetMinter(20, address(minter), settings);

        vm.prank(founder);
        minter.resetMintSettings(address(token));

        (uint64 mintStart, uint64 mintEnd, uint64 pricePerToken, address redeem) = minter.redeemSettings(address(token));
        assertEq(mintStart, 0);
        assertEq(mintEnd, 0);
        assertEq(pricePerToken, 0);
        assertEq(redeem, address(0));
    }

    // ===== SECURITY FIX TESTS =====

    /// @notice Test that duplicate redemption is prevented
    function testRevert_DuplicateRedemption() public {
        ERC721RedeemMinter.RedeemSettings memory settings = ERC721RedeemMinter.RedeemSettings({
            mintStart: 0,
            mintEnd: uint64(block.timestamp + 1000),
            pricePerToken: 0 ether,
            redeemToken: address(redeemToken)
        });

        deployAltMockAndSetMinter(20, address(minter), settings);

        redeemToken.mint(claimer1, 4);

        uint256[] memory tokenIds = new uint256[](1);
        tokenIds[0] = 4;

        // First redemption should succeed
        minter.mintFromReserve(address(token), tokenIds);
        assertEq(token.ownerOf(4), claimer1);

        // Second redemption should fail
        vm.expectRevert(abi.encodeWithSignature("ALREADY_REDEEMED()"));
        minter.mintFromReserve(address(token), tokenIds);
    }

    /// @notice Test that duplicate IDs in same call are prevented
    function testRevert_DuplicateIdsInSameCall() public {
        ERC721RedeemMinter.RedeemSettings memory settings = ERC721RedeemMinter.RedeemSettings({
            mintStart: 0,
            mintEnd: uint64(block.timestamp + 1000),
            pricePerToken: 0 ether,
            redeemToken: address(redeemToken)
        });

        deployAltMockAndSetMinter(20, address(minter), settings);

        redeemToken.mint(claimer1, 5);

        // Try to redeem same tokenId twice in one call
        uint256[] memory tokenIds = new uint256[](2);
        tokenIds[0] = 5;
        tokenIds[1] = 5;

        vm.expectRevert(abi.encodeWithSignature("ALREADY_REDEEMED()"));
        minter.mintFromReserve(address(token), tokenIds);
    }

    /// @notice Test that exact payment is required (overpayment rejected)
    function testRevert_Overpayment() public {
        ERC721RedeemMinter.RedeemSettings memory settings = ERC721RedeemMinter.RedeemSettings({
            mintStart: 0,
            mintEnd: uint64(block.timestamp + 1000),
            pricePerToken: 0.01 ether,
            redeemToken: address(redeemToken)
        });

        deployAltMockAndSetMinter(20, address(minter), settings);

        redeemToken.mint(claimer1, 4);

        uint256[] memory tokenIds = new uint256[](1);
        tokenIds[0] = 4;

        uint256 correctFee = minter.getTotalFeesForMint(address(token), 1);

        // Try to send too much
        vm.deal(claimer1, 10 ether);
        vm.prank(claimer1);
        vm.expectRevert(abi.encodeWithSignature("INVALID_VALUE()"));
        minter.mintFromReserve{ value: correctFee + 1 wei }(address(token), tokenIds);
    }

    /// @notice Test settings validation - mintEnd <= mintStart
    function testRevert_InvalidTimeRange() public {
        deployAltMock(20);

        ERC721RedeemMinter.RedeemSettings memory settings = ERC721RedeemMinter.RedeemSettings({
            mintStart: uint64(block.timestamp + 1000),
            mintEnd: uint64(block.timestamp + 999), // End before start
            pricePerToken: 0 ether,
            redeemToken: address(redeemToken)
        });

        vm.prank(founder);
        vm.expectRevert(abi.encodeWithSignature("INVALID_SETTINGS()"));
        minter.setMintSettings(address(token), settings);
    }

    /// @notice Test settings validation - mintEnd in past
    function testRevert_MintEndInPast() public {
        deployAltMock(20);

        ERC721RedeemMinter.RedeemSettings memory settings = ERC721RedeemMinter.RedeemSettings({
            mintStart: 0,
            mintEnd: uint64(block.timestamp - 1), // In the past
            pricePerToken: 0 ether,
            redeemToken: address(redeemToken)
        });

        vm.prank(founder);
        vm.expectRevert(abi.encodeWithSignature("INVALID_SETTINGS()"));
        minter.setMintSettings(address(token), settings);
    }

    /// @notice Test settings validation - zero address redeemToken
    function testRevert_ZeroAddressRedeemToken() public {
        deployAltMock(20);

        ERC721RedeemMinter.RedeemSettings memory settings = ERC721RedeemMinter.RedeemSettings({
            mintStart: 0,
            mintEnd: uint64(block.timestamp + 1000),
            pricePerToken: 0 ether,
            redeemToken: address(0) // Zero address
         });

        vm.prank(founder);
        vm.expectRevert(abi.encodeWithSignature("INVALID_SETTINGS()"));
        minter.setMintSettings(address(token), settings);
    }

    /// @notice Test settings validation - cannot redeem self
    function testRevert_CannotRedeemSelf() public {
        deployAltMock(20);

        ERC721RedeemMinter.RedeemSettings memory settings = ERC721RedeemMinter.RedeemSettings({
            mintStart: 0,
            mintEnd: uint64(block.timestamp + 1000),
            pricePerToken: 0 ether,
            redeemToken: address(token) // Self reference
         });

        vm.prank(founder);
        vm.expectRevert(abi.encodeWithSignature("INVALID_SETTINGS()"));
        minter.setMintSettings(address(token), settings);
    }

    /// @notice Test that redeemed mapping is correctly set
    function test_RedeemedMappingSet() public {
        ERC721RedeemMinter.RedeemSettings memory settings = ERC721RedeemMinter.RedeemSettings({
            mintStart: 0,
            mintEnd: uint64(block.timestamp + 1000),
            pricePerToken: 0 ether,
            redeemToken: address(redeemToken)
        });

        deployAltMockAndSetMinter(20, address(minter), settings);

        redeemToken.mint(claimer1, 4);
        redeemToken.mint(claimer1, 5);

        uint256[] memory tokenIds = new uint256[](2);
        tokenIds[0] = 4;
        tokenIds[1] = 5;

        // Before redemption
        assertEq(minter.redeemed(address(token), 4), false);
        assertEq(minter.redeemed(address(token), 5), false);

        minter.mintFromReserve(address(token), tokenIds);

        // After redemption
        assertEq(minter.redeemed(address(token), 4), true);
        assertEq(minter.redeemed(address(token), 5), true);

        // Unredeemed token should still be false
        assertEq(minter.redeemed(address(token), 6), false);
    }

    /// @notice Test exact payment with multiple tokens
    function test_ExactPaymentMultipleTokens() public {
        ERC721RedeemMinter.RedeemSettings memory settings = ERC721RedeemMinter.RedeemSettings({
            mintStart: 0,
            mintEnd: uint64(block.timestamp + 1000),
            pricePerToken: 0.01 ether,
            redeemToken: address(redeemToken)
        });

        deployAltMockAndSetMinter(20, address(minter), settings);

        redeemToken.mint(claimer1, 4);
        redeemToken.mint(claimer1, 5);

        uint256[] memory tokenIds = new uint256[](2);
        tokenIds[0] = 4;
        tokenIds[1] = 5;

        uint256 exactFee = minter.getTotalFeesForMint(address(token), 2);
        vm.deal(claimer1, exactFee);

        vm.prank(claimer1);
        minter.mintFromReserve{ value: exactFee }(address(token), tokenIds);

        assertEq(token.ownerOf(4), claimer1);
        assertEq(token.ownerOf(5), claimer1);
        assertEq(claimer1.balance, 0); // All funds used
    }

    /// @notice Test that token minting can fail gracefully for free mints
    function test_SkipAlreadyMintedTokensFreeMint() public {
        ERC721RedeemMinter.RedeemSettings memory settings = ERC721RedeemMinter.RedeemSettings({
            mintStart: 0,
            mintEnd: uint64(block.timestamp + 1000),
            pricePerToken: 0, // Free mint
            redeemToken: address(redeemToken)
        });

        deployAltMockAndSetMinter(20, address(minter), settings);

        redeemToken.mint(claimer1, 4);
        redeemToken.mint(claimer1, 5);

        // Enable the minter to mint directly
        TokenTypesV2.MinterParams[] memory minterParams = new TokenTypesV2.MinterParams[](1);
        minterParams[0] = TokenTypesV2.MinterParams({ minter: address(minter), allowed: true });
        vm.prank(token.owner());
        token.updateMinters(minterParams);

        // Manually mint token 4 beforehand
        vm.prank(address(minter));
        token.mintFromReserveTo(claimer1, 4);

        uint256[] memory tokenIds = new uint256[](2);
        tokenIds[0] = 4; // Already minted
        tokenIds[1] = 5; // Not minted yet

        // Should succeed, skipping token 4 and minting token 5
        minter.mintFromReserve(address(token), tokenIds);

        assertEq(token.ownerOf(4), claimer1);
        assertEq(token.ownerOf(5), claimer1);
    }

    /// @notice Test that token minting fails if paying and token already minted
    function testRevert_AlreadyMintedPaidMint() public {
        ERC721RedeemMinter.RedeemSettings memory settings = ERC721RedeemMinter.RedeemSettings({
            mintStart: 0,
            mintEnd: uint64(block.timestamp + 1000),
            pricePerToken: 0.01 ether, // Paid mint
            redeemToken: address(redeemToken)
        });

        deployAltMockAndSetMinter(20, address(minter), settings);

        redeemToken.mint(claimer1, 4);

        // Enable the minter to mint directly
        TokenTypesV2.MinterParams[] memory minterParams = new TokenTypesV2.MinterParams[](1);
        minterParams[0] = TokenTypesV2.MinterParams({ minter: address(minter), allowed: true });
        vm.prank(token.owner());
        token.updateMinters(minterParams);

        // Manually mint token 4 beforehand
        vm.prank(address(minter));
        token.mintFromReserveTo(claimer1, 4);

        uint256[] memory tokenIds = new uint256[](1);
        tokenIds[0] = 4; // Already minted

        uint256 fees = minter.getTotalFeesForMint(address(token), 1);
        vm.deal(claimer1, fees);

        // Should revert because user is paying for a token that can't be minted
        vm.prank(claimer1);
        vm.expectRevert(abi.encodeWithSignature("ERROR_MINTING_TOKEN(uint256)", 4));
        minter.mintFromReserve{ value: fees }(address(token), tokenIds);
    }

    /// @notice Test that all tokens being already minted causes NO_TOKENS_MINTED error
    function testRevert_NoTokensMinted() public {
        ERC721RedeemMinter.RedeemSettings memory settings = ERC721RedeemMinter.RedeemSettings({
            mintStart: 0,
            mintEnd: uint64(block.timestamp + 1000),
            pricePerToken: 0, // Free mint
            redeemToken: address(redeemToken)
        });

        deployAltMockAndSetMinter(20, address(minter), settings);

        redeemToken.mint(claimer1, 4);
        redeemToken.mint(claimer1, 5);

        // Enable the minter to mint directly
        TokenTypesV2.MinterParams[] memory minterParams = new TokenTypesV2.MinterParams[](1);
        minterParams[0] = TokenTypesV2.MinterParams({ minter: address(minter), allowed: true });
        vm.prank(token.owner());
        token.updateMinters(minterParams);

        // Manually mint all tokens beforehand
        vm.startPrank(address(minter));
        token.mintFromReserveTo(claimer1, 4);
        token.mintFromReserveTo(claimer1, 5);
        vm.stopPrank();

        uint256[] memory tokenIds = new uint256[](2);
        tokenIds[0] = 4;
        tokenIds[1] = 5;

        // Should revert because no tokens could be minted
        vm.expectRevert(abi.encodeWithSignature("NO_TOKENS_MINTED()"));
        minter.mintFromReserve(address(token), tokenIds);
    }

    /// @notice Test helper to deploy without setting minter
    function deployAltMock(uint256 _reservedUntilTokenId) internal {
        setMockFounderParams();
        setMockTokenParamsWithReserve(_reservedUntilTokenId);
        setMockAuctionParams();
        setMockGovParams();
        deploy(foundersArr, tokenParams, auctionParams, govParams);
        setMockMetadata();
    }
}
