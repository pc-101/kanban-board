import { expect, type Page, test } from "@playwright/test";

const boardId = "dev-product-launch";

async function openBoard(page: Page) {
  await page.goto("/");
  await expect(page.getByRole("combobox", { name: "Select board" })).toHaveValue(boardId);
}

async function stageTaskTitle(page: Page, currentTitle: string, nextTitle: string) {
  await page.getByText(currentTitle, { exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.getByLabel("Title").fill(nextTitle);
  return dialog;
}

async function saveTask(page: Page) {
  const patchResponse = page.waitForResponse((response) => (
    response.url().includes("/rest/v1/rpc/apply_board_patch") && response.ok()
  ));

  await page.getByRole("dialog").getByRole("button", { name: "Save changes" }).click();
  await patchResponse;
}

test("merges simultaneous edits to different tasks", async ({ browser }) => {
  const aliceContext = await browser.newContext();
  const bobContext = await browser.newContext();
  const alice = await aliceContext.newPage();
  const bob = await bobContext.newPage();

  await Promise.all([openBoard(alice), openBoard(bob)]);

  await stageTaskTitle(alice, "Draft launch plan", "Alice updated the launch plan");
  await stageTaskTitle(bob, "Prepare demo script", "Bob updated the demo script");
  await Promise.all([saveTask(alice), saveTask(bob)]);

  await Promise.all([alice.reload(), bob.reload()]);
  for (const page of [alice, bob]) {
    await expect(page.getByText("Alice updated the launch plan", { exact: true })).toBeVisible();
    await expect(page.getByText("Bob updated the demo script", { exact: true })).toBeVisible();
  }

  await Promise.all([aliceContext.close(), bobContext.close()]);
});

test("delivers a collaborator edit without reloading", async ({ browser }) => {
  const aliceContext = await browser.newContext();
  const bobContext = await browser.newContext();
  const alice = await aliceContext.newPage();
  const bob = await bobContext.newPage();

  await Promise.all([openBoard(alice), openBoard(bob)]);
  await stageTaskTitle(alice, "Finalize pricing page copy", "Finalize collaborative pricing copy");
  await saveTask(alice);

  await expect(bob.getByText("Finalize collaborative pricing copy", { exact: true })).toBeVisible();

  await Promise.all([aliceContext.close(), bobContext.close()]);
});

test("uses last-write-wins when two collaborators edit the same task", async ({ browser }) => {
  const aliceContext = await browser.newContext();
  const bobContext = await browser.newContext();
  const alice = await aliceContext.newPage();
  const bob = await bobContext.newPage();

  await Promise.all([openBoard(alice), openBoard(bob)]);
  await stageTaskTitle(alice, "Create stakeholder brief", "Alice stakeholder brief");
  await stageTaskTitle(bob, "Create stakeholder brief", "Bob stakeholder brief");

  await saveTask(alice);
  await saveTask(bob);
  await Promise.all([alice.reload(), bob.reload()]);

  for (const page of [alice, bob]) {
    await expect(page.getByText("Bob stakeholder brief", { exact: true })).toBeVisible();
    await expect(page.getByText("Alice stakeholder brief", { exact: true })).toHaveCount(0);
  }

  await Promise.all([aliceContext.close(), bobContext.close()]);
});
