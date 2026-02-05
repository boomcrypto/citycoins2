
import {
    Button,
    Stack,
    Text
} from "@chakra-ui/react";
import { useAtomValue } from "jotai";
import { useCcipProposalVoteActions } from "../../hooks/use-ccip-proposal-vote-actions";
import { hasVotedAtom } from "../../store/ccip-016";
import { CCIP_026_CONFIG } from "../../store/ccip-proposal";
import { stxAddressAtom } from "../../store/stacks";
import SignIn from "../auth/sign-in";

function VoteButtons() {
    const { voteYes, voteNo } = useCcipProposalVoteActions(CCIP_026_CONFIG);
    const hasVoted = useAtomValue(hasVotedAtom);
    const stxAddress = useAtomValue(stxAddressAtom);

    if (!stxAddress) {
        return <SignIn />;
    }

    return (
        <>
            <Text fontWeight="bold">{hasVoted ? "Change vote" : "Voting"}:</Text>
            <Stack direction={["column", "row"]} gap={4}>
                <Button onClick={voteYes} colorPalette="green" size="lg" mb={4}>
                    Vote Yes
                </Button>
                <Button onClick={voteNo} colorPalette="red" size="lg">
                    Vote No
                </Button>
            </Stack>
        </>
    );
}

export default VoteButtons;