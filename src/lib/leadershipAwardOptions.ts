export type LeadershipAwardOption = {
  value: string;
  label: string;
  group: "pioneros" | "seguidores" | "exploradores";
};

const leadershipSeries = [
  { group: "pioneros", start: 101 },
  { group: "seguidores", start: 201 },
  { group: "exploradores", start: 301 },
] as const;

export const leadershipAwardOptions: LeadershipAwardOption[] =
  leadershipSeries.flatMap(({ group, start }) =>
    Array.from({ length: 6 }, (_, index) => {
      const number = String(start + index);

      return {
        value: number,
        label: `Liderazgo ${number}`,
        group,
      };
    })
  );

export const getLeadershipAwardOptions = (group?: string) =>
  group && group !== "all"
    ? leadershipAwardOptions.filter((award) => award.group === group)
    : leadershipAwardOptions;

export const isLeadershipAwardId = (value: string) =>
  leadershipAwardOptions.some((award) => award.value === value);
