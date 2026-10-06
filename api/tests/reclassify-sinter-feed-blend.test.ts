import assert from "node:assert/strict";

import type { Prisma } from "@prisma/client";

import { reclassifyUnclassifiedRecordsForMapping } from "../src/repositories/record.repository";

type UpdateManyArgs = {
  where: {
    sinterFeedValue: string;
    sinterFeedBlendMappingId: null;
    dataHora: { gte: Date; lt?: Date };
  };
  data: { sinterFeedBlendMappingId: string };
};

const calls: UpdateManyArgs[] = [];
const tx = {
  record: {
    updateMany: async (args: UpdateManyArgs) => {
      calls.push(args);
      return { count: 2 };
    }
  }
} as unknown as Prisma.TransactionClient;

const startsAt = new Date("2026-10-01T00:00:00.000Z");
const endsAt = new Date("2026-11-01T00:00:00.000Z");

const run = async () => {
  const count = await reclassifyUnclassifiedRecordsForMapping(tx, {
    id: "mapping-id",
    startsAt,
    endsAt,
    sinterFeed: { code: "SINTER FEED 18" }
  });

  assert.equal(count, 2);
  assert.deepEqual(calls[0], {
    where: {
      sinterFeedValue: "SINTER FEED 18",
      sinterFeedBlendMappingId: null,
      dataHora: { gte: startsAt, lt: endsAt }
    },
    data: { sinterFeedBlendMappingId: "mapping-id" }
  });

  await reclassifyUnclassifiedRecordsForMapping(tx, {
    id: "open-ended-mapping-id",
    startsAt,
    endsAt: null,
    sinterFeed: { code: "SINTER FEED 18" }
  });

  assert.deepEqual(calls[1]?.where.dataHora, { gte: startsAt });
};

void run();
