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
      <Text mb={[4, 0]} fontSize="xl">
        {props.title}
      </Text>
      <Badge
        minW={100}
        fontWeight="bold"
        colorPalette={getStatusColor(props.status)}
        justifyContent="center"
        p={[2, 4]}
      >
        {props.status.toUpperCase()}
      </Badge>
    </Box>
  );
}

export default VoteTitle;
