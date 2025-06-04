import { Box, Progress, Text } from "@chakra-ui/react";
import { formatMicroAmount } from "../../store/common";
import { Ccip016VoteTotals } from "../../store/ccip-016";

interface VoteProgressBarV2Props {
  props: Ccip016VoteTotals;
}

function VoteProgressBarV2({ props }: VoteProgressBarV2Props) {
  console.log("VoteProgressBarV2 props:", props);
  const totalVotes = props.totals.totalAmountYes + props.totals.totalAmountNo;
  const yesVotePercentage = (props.totals.totalAmountYes / totalVotes) * 100;

  return (
    <Box width="100%">
      <Progress.Root
        value={yesVotePercentage}
        size="lg"
        colorScheme="green"
      />
      <Box display="flex" flexWrap="wrap" justifyContent="space-between" mt={2}>
        <Text
          title={`MIA ${formatMicroAmount(
            props.mia.totalAmountYes
          )} / NYC ${formatMicroAmount(props.nyc.totalAmountYes)}`}
        >{`Yes: ${formatMicroAmount(
          props.totals.totalAmountYes
        )} CityCoins`}</Text>
        <Text
          title={`MIA ${formatMicroAmount(
            props.mia.totalAmountNo
          )} / NYC ${formatMicroAmount(props.nyc.totalAmountNo)}`}
        >{`No: ${formatMicroAmount(
          props.totals.totalAmountNo
        )} CityCoins`}</Text>
      </Box>
    </Box>
  );
}

export default VoteProgressBarV2;
