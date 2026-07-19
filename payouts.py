import json
from datetime import datetime


class Payout:
    def __init__(self, amount, status, reviewer, transaction_reference):
        self.amount = amount
        self.status = status
        self.reviewer = reviewer
        self.transaction_reference = transaction_reference


def generate_receipt(payout: Payout) -> str:
    """Generates a durable receipt for the given payout.

    :param payout: Payout object containing the details of the payout.
    :return: A JSON string representing the receipt.
    """
    # Ensure no private member data is exposed
    receipt_data = {
        "payout_amount": f"${payout.amount:.2f}",
        "payout_status": payout.status,
        "reviewed_by": payout.reviewer,
        "transaction_reference": payout.transaction_reference,
        "generated_at": datetime.now().isoformat()
    }
    return json.dumps(receipt_data, indent=4)


def verify_receipt(receipt: str) -> bool:
    """Verifies the receipt on both mobile and desktop platforms.

    :param receipt: The receipt string to be verified.
    :return: True if the receipt is valid, False otherwise.
    """
    try:
        receipt_data = json.loads(receipt)
        required_fields = ["payout_amount", "payout_status", "reviewed_by", "transaction_reference", "generated_at"]
        return all(field in receipt_data for field in required_fields)
    except (json.JSONDecodeError, KeyError):
        return False


# Example usage
if __name__ == "__main__":
    # Create a sample payout
    sample_payout = Payout(amount=100.00, status="Approved", reviewer="John Doe", transaction_reference="TX123456")
    
    # Generate the receipt
    receipt = generate_receipt(sample_payout)
    print("Generated Receipt:")
    print(receipt)
    
    # Verify the receipt
    is_valid = verify_receipt(receipt)
    print(f"Receipt is valid: {is_valid}")


# Tests for different payout states
def test_generate_receipt():
    # Test with a completed payout
    completed_payout = Payout(amount=200.00, status="Completed", reviewer="Jane Smith", transaction_reference="TX789012")
    completed_receipt = generate_receipt(completed_payout)
    assert verify_receipt(completed_receipt), "Test failed: Completed receipt should be valid"
    
    # Test with a missing payout
    missing_payout = Payout(amount=None, status="Pending", reviewer="Alice Johnson", transaction_reference="TX345678")
    missing_receipt = generate_receipt(missing_payout)
    assert not verify_receipt(missing_receipt), "Test failed: Missing receipt should be invalid"


if __name__ == "__main__":
    test_generate_receipt()