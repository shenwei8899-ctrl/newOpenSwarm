import { Injectable } from "@nestjs/common";
import { Queue } from "bullmq";
import IORedis from "ioredis";
import {
  type AutonomyStepJob,
  type DiscussionRunJob,
  type TaskRunJob,
  queueNames
} from "@openswarm/shared";

function getRedisConnection() {
  return new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379", {
    maxRetriesPerRequest: null
  });
}

@Injectable()
export class QueueService {
  private readonly connection = getRedisConnection();

  private readonly discussionsQueue = new Queue<DiscussionRunJob>(
    queueNames.discussions,
    {
      connection: this.connection
    }
  );

  private readonly tasksQueue = new Queue<TaskRunJob>(queueNames.tasks, {
    connection: this.connection
  });

  private readonly autonomyQueue = new Queue<AutonomyStepJob>(queueNames.autonomy, {
    connection: this.connection
  });

  async enqueueDiscussionRun(job: DiscussionRunJob) {
    return this.discussionsQueue.add("run-discussion", job);
  }

  async enqueueTaskRun(job: TaskRunJob) {
    return this.tasksQueue.add("run-task", job);
  }

  async enqueueAutonomyStepRun(job: AutonomyStepJob) {
    return this.autonomyQueue.add("run-autonomy-step", job);
  }
}
