
import {
    List,
    Stack,
    Text
} from "@chakra-ui/react";
import { useCcipProposalVoteData } from "../../hooks/use-ccip-proposal-vote-data";
import { CCIP_026_CONFIG } from "../../store/ccip-proposal";
import { formatMicroAmount } from "../../store/common";

function VoteResult() {
    const voterInfo = useCcipProposalVoteData(CCIP_026_CONFIG, "voterInfo");

    return (
        <Stack gap={4}>
            <Text fontWeight="bold">Your Vote:</Text>
            <List.Root>
                <List.Item>
                    Recorded Vote: {voterInfo.data?.vote ? "Yes" : "No"}
                </List.Item>
                <List.Root>
                    <List.Item>MIA: {formatMicroAmount(voterInfo.data?.mia || 0)}</List.Item>
                </List.Root>
            </List.Root>
        </Stack>
    );
}

export default VoteResult;