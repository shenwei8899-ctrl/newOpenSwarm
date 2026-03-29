import { expect, test } from "@playwright/test";

test("discussion to task happy path", async ({ page }) => {
  const runId = Date.now().toString().slice(-6);
  const discussionTitle = `自动化讨论-${runId}`;
  const messageBody = `请围绕自动化测试-${runId} 生成一轮讨论，并输出可执行建议。`;
  const taskTitle = `自动化任务-${runId}`;

  await page.goto("/");
  await page.getByRole("link", { name: "我的团队" }).click();
  await page.getByRole("link", { name: "进入讨论工作台" }).click();

  await page.getByPlaceholder("例如：早餐店小红书引流讨论").fill(discussionTitle);
  await page.getByRole("button", { name: "创建讨论" }).click();
  await expect(page.getByText("讨论已创建，可以继续发送消息或直接运行讨论。")).toBeVisible();
  await expect(page.getByRole("heading", { name: discussionTitle })).toBeVisible();

  await page.getByPlaceholder("输入你的任务、问题或补充背景...").fill(messageBody);
  await page.getByRole("button", { name: "发送消息" }).click();
  await expect(page.getByText("消息已发送，讨论记录已更新。")).toBeVisible();
  await expect(page.getByText(messageBody)).toBeVisible();

  await page.getByRole("button", { name: "运行讨论" }).click();
  await expect(page.getByText("讨论已进入执行队列，稍后会回写最新消息与摘要。")).toBeVisible();

  await expect
    .poll(
      async () => {
        await page.reload();
        return await page.locator("article").count();
      },
      {
        timeout: 60_000,
        message: "waiting for employee discussion messages"
      }
    )
    .toBeGreaterThan(1);

  await expect
    .poll(
      async () => {
        await page.reload();
        const summaryNode = page.getByText(/^总结：/).first();
        return (await summaryNode.textContent()) ?? "";
      },
      {
        timeout: 60_000,
        message: "waiting for discussion summary"
      }
    )
    .not.toContain("暂无摘要");

  await page.getByRole("link", { name: "返回团队工作台" }).click();
  await page.getByRole("link", { name: "进入任务工作台" }).click();

  await page.getByPlaceholder("例如：输出门店两周引流执行方案").fill(taskTitle);
  await page.getByRole("button", { name: "创建任务" }).click();
  await expect(page.getByText("任务已创建，可以继续指派员工或直接执行。")).toBeVisible();
  await expect(page.getByText(taskTitle)).toBeVisible();

  const taskCard = page.locator("div").filter({ has: page.getByText(taskTitle) }).first();
  await taskCard.getByRole("button", { name: "执行任务" }).click();
  await expect(page.getByText("任务已进入执行队列，稍后刷新即可看到最新状态。")).toBeVisible();

  await expect
    .poll(
      async () => {
        await page.reload();
        const card = page.locator("div").filter({ has: page.getByText(taskTitle) }).first();
        const text = await card.textContent();
        return text ?? "";
      },
      {
        timeout: 90_000,
        message: "waiting for task completion"
      }
    )
    .toContain("done");
});
