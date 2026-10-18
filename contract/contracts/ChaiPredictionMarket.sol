// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title ChaiPredictionMarket — play-token prediction markets for a college forecasting club
/// @notice Play tokens only. No real money, no ERC-20, no approvals — an internal ledger.
///         Positions are discoverable per user through the indexed `BetPlaced` event
///         (address-indexed `user`), so frontends never have to scan every market.
contract ChaiPredictionMarket {
    struct Market {
        uint256 id;
        string question;
        uint64 closesAt; // unix seconds when betting closes (0 = organizer decides)
        bool resolved;
        uint8 winningSide; // 0 = none, 1 = YES, 2 = NO
        uint256 yesPool;
        uint256 noPool;
        uint64 createdAt;
    }

    uint256 public constant FAUCET_AMOUNT = 100 ether; // play tokens, 18 decimals
    uint256 public constant MIN_BET = 1 ether;
    uint256 public constant DECIMALS = 18;

    address public immutable admin;
    uint256 public marketCount;

    mapping(uint256 => Market) internal _markets;
    mapping(address => uint256) public playBalance;
    mapping(address => mapping(uint256 => uint256)) public betYes;
    mapping(address => mapping(uint256 => uint256)) public betNo;
    mapping(address => mapping(uint256 => bool)) public claimed;
    mapping(address => bool) public faucetUsed;

    event MarketCreated(uint256 indexed marketId, string question, uint64 closesAt);
    event MarketResolved(uint256 indexed marketId, uint8 winningSide);
    event BetPlaced(address indexed user, uint256 indexed marketId, uint8 side, uint256 amount, uint64 timestamp);
    event WinningsClaimed(address indexed user, uint256 indexed marketId, uint256 payout);
    event FaucetGranted(address indexed user, uint256 amount);

    error NotAdmin();
    error MarketNotFound();
    error AlreadyResolved();
    error MarketNotResolved();
    error BettingClosed();
    error InvalidSide();
    error AmountTooSmall();
    error InsufficientBalance();
    error FaucetAlreadyUsed();
    error NothingToClaim();
    error AlreadyClaimed();

    modifier onlyAdmin() {
        if (msg.sender != admin) revert NotAdmin();
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    /// @notice Organizer creates a market with a precise question and a betting deadline.
    function createMarket(string calldata question, uint64 closesAt) external onlyAdmin returns (uint256) {
        uint256 id = marketCount++;
        _markets[id] = Market(id, question, closesAt, false, 0, 0, 0, uint64(block.timestamp));
        emit MarketCreated(id, question, closesAt);
        return id;
    }

    /// @notice One free stack of play tokens per member, so anyone can join the club.
    function faucet() external {
        if (faucetUsed[msg.sender]) revert FaucetAlreadyUsed();
        faucetUsed[msg.sender] = true;
        playBalance[msg.sender] += FAUCET_AMOUNT;
        emit FaucetGranted(msg.sender, FAUCET_AMOUNT);
    }

    /// @notice Back YES (side = 1) or NO (side = 2) with play tokens.
    function placeBet(uint256 marketId, uint8 side, uint256 amount) external {
        if (marketId >= marketCount) revert MarketNotFound();
        Market storage m = _markets[marketId];
        if (m.resolved) revert AlreadyResolved();
        if (m.closesAt != 0 && block.timestamp > m.closesAt) revert BettingClosed();
        if (side != 1 && side != 2) revert InvalidSide();
        if (amount < MIN_BET) revert AmountTooSmall();
        uint256 bal = playBalance[msg.sender];
        if (bal < amount) revert InsufficientBalance();
        playBalance[msg.sender] = bal - amount;
        if (side == 1) {
            m.yesPool += amount;
            betYes[msg.sender][marketId] += amount;
        } else {
            m.noPool += amount;
            betNo[msg.sender][marketId] += amount;
        }
        emit BetPlaced(msg.sender, marketId, side, amount, uint64(block.timestamp));
    }

    /// @notice Organizer settles a market against a named source (news, RBI, the canteen).
    function resolveMarket(uint256 marketId, uint8 winningSide) external onlyAdmin {
        if (marketId >= marketCount) revert MarketNotFound();
        Market storage m = _markets[marketId];
        if (m.resolved) revert AlreadyResolved();
        if (winningSide != 1 && winningSide != 2) revert InvalidSide();
        m.resolved = true;
        m.winningSide = winningSide;
        emit MarketResolved(marketId, winningSide);
    }

    /// @notice Winners claim a proportional slice of the whole pool. All math in wei.
    function claim(uint256 marketId) external {
        if (marketId >= marketCount) revert MarketNotFound();
        Market storage m = _markets[marketId];
        if (!m.resolved) revert MarketNotResolved();
        if (claimed[msg.sender][marketId]) revert AlreadyClaimed();

        uint256 stake = m.winningSide == 1 ? betYes[msg.sender][marketId] : betNo[msg.sender][marketId];
        if (stake == 0) revert NothingToClaim();

        uint256 winnerPool = m.winningSide == 1 ? m.yesPool : m.noPool;
        uint256 payout = (stake * (m.yesPool + m.noPool)) / winnerPool;

        claimed[msg.sender][marketId] = true;
        playBalance[msg.sender] += payout;
        emit WinningsClaimed(msg.sender, marketId, payout);
    }

    function getMarket(uint256 marketId) external view returns (Market memory) {
        if (marketId >= marketCount) revert MarketNotFound();
        return _markets[marketId];
    }
}
