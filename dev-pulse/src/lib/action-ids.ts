// Deterministic action IDs from One's platform catalog.
// These are stable across all One accounts — they reference
// specific platform API endpoints, not user-specific data.
//
// To find an action ID:
//   one actions search <platform> "<query>"

export const ACTION_IDS = {
  github: {
    listRepos: "conn_mod_def::GJ3aJv0FLn0::-lTycDc4TMG2EV3FIxpXVA",
    listPRs: "conn_mod_def::GJ3ZxjBXxMQ::_MimZcghS8q0ydHS-ZafJg",
  },
  linear: {
    graphql: "conn_mod_def::GJ4vJTdCQPY::f4IhKVnuTv6Us2d-GwWvCw",
    listTeams: "conn_mod_def::GJ4vO-Ddh7M::KSYGS5jiTo66YMeRWLjeSQ",
  },
  calendar: {
    listEvents: "conn_mod_def::GJ6RlnIYK20::YzuWSmaVQgurletRDNJavA",
  },
  slack: {
    listConversations: "conn_mod_def::GJ7H9zmRFIk::1RxrzeicS-ibnXF4sFC5Ww",
  },
} as const;
