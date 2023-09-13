import { Badge, Box, Text } from "@chakra-ui/react";
import { VoteStatus } from "../../store/common";

function getStatusColor(status: VoteStatus) {
  switch (status) {
    case "passed":
      return "green";
    case "failed":
      return "red";
    case "active":
      return "orange";
    case "pending":
      return "gray";
    default:
      return "gray";
  }
}

function VoteTitle(props: { title: string; status: VoteStatus }) {
  return (
    <Box
      as="span"
      fontWeight="bold"
      flex="1"
      display="flex"
      flexDirection={["column", "row"]}
      justifyContent="space-between"
      alignItems={["left", "center"]}
      textAlign="left"
      py={[8, 4]}
    >
      <Text>{props.title}</Text>
      <Badge
        minW={100}
        textAlign="center"
        colorScheme={getStatusColor(props.status)}
        p={[2, 4]}
      >
        {props.status}
      </Badge>
    </Box>
  );
}

export default VoteTitle;
