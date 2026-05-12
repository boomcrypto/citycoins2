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

function VoteTitle(props: {
  title: string;
  status: VoteStatus;
  dateLabel?: string;
}) {
  return (
    <Box
      as="span"
      fontWeight="bold"
      flex="1"
      display="flex"
      flexDirection={["column", "row"]}
      justifyContent="space-between"
      alignItems={["flex-start", "center"]}
      gap={[3, 6]}
      textAlign="left"
      py={[8, 4]}
    >
      <Box as="span" minW={0}>
        <Text as="span" display="block" fontSize="xl">
          {props.title}
        </Text>
        {props.dateLabel && (
          <Text
            as="span"
            display="block"
            color="fg.muted"
            fontSize="sm"
            fontWeight="medium"
            mt={1}
          >
            {props.dateLabel}
          </Text>
        )}
      </Box>
      <Badge
        minW={100}
        flexShrink={0}
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
