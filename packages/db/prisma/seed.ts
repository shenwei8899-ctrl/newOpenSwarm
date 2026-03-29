import { prisma } from "../src";

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { slug: "demo" },
    update: { name: "OpenSwarm Demo" },
    create: {
      slug: "demo",
      name: "OpenSwarm Demo"
    }
  });

  await prisma.user.upsert({
    where: { email: "owner@openswarm.local" },
    update: { tenantId: tenant.id, role: "owner" },
    create: {
      tenantId: tenant.id,
      email: "owner@openswarm.local",
      name: "OpenSwarm Owner",
      role: "owner"
    }
  });

  const employees = [
    {
      id: "employee_xhs_ops",
      name: "小红书运营",
      role: "运营",
      description: "先澄清目标，再执行动作。",
      agentName: "xhs_ops",
      modelName: "gpt-5.4"
    },
    {
      id: "employee_crawler",
      name: "爬虫专家",
      role: "研究",
      description: "优先补齐外部信息和案例证据。",
      agentName: "crawler_expert",
      modelName: "gpt-5.4"
    },
    {
      id: "employee_backend",
      name: "后端工程师",
      role: "工程",
      description: "把执行路径做稳定，把状态做清晰。",
      agentName: "backend_engineer",
      modelName: "gpt-5.4"
    }
  ];

  for (const employee of employees) {
    await prisma.employee.upsert({
      where: { agentName: employee.agentName },
      update: employee,
      create: employee
    });
  }

  const skills = [
    {
      id: "summarize",
      name: "Summarize",
      description: "Summarize long-form content into concise insights.",
      category: "general"
    },
    {
      id: "filesystem",
      name: "Filesystem",
      description: "Read and write project files in controlled execution space.",
      category: "system"
    },
    {
      id: "agent-browser",
      name: "Agent Browser",
      description: "Use browser automation for external research workflows.",
      category: "web"
    }
  ];

  for (const skill of skills) {
    await prisma.skill.upsert({
      where: { id: skill.id },
      update: skill,
      create: {
        ...skill,
        source: "deerflow",
        enabled: true
      }
    });
  }

  const project = await prisma.project.upsert({
    where: { id: "proj_demo_xhs_ops" },
    update: {
      tenantId: tenant.id,
      name: "小红书运营 team",
      status: "active"
    },
    create: {
      id: "proj_demo_xhs_ops",
      tenantId: tenant.id,
      name: "小红书运营 team",
      status: "active"
    }
  });

  await prisma.projectEmployee.upsert({
    where: {
      projectId_employeeId: {
        projectId: project.id,
        employeeId: "employee_xhs_ops"
      }
    },
    update: { sortOrder: 0 },
    create: {
      projectId: project.id,
      employeeId: "employee_xhs_ops",
      sortOrder: 0
    }
  });

  await prisma.projectEmployee.upsert({
    where: {
      projectId_employeeId: {
        projectId: project.id,
        employeeId: "employee_crawler"
      }
    },
    update: { sortOrder: 1 },
    create: {
      projectId: project.id,
      employeeId: "employee_crawler",
      sortOrder: 1
    }
  });

  await prisma.employeeSkill.deleteMany({
    where: { projectId: project.id }
  });

  await prisma.employeeSkill.createMany({
    data: [
      {
        projectId: project.id,
        employeeId: "employee_xhs_ops",
        skillId: "summarize"
      },
      {
        projectId: project.id,
        employeeId: "employee_crawler",
        skillId: "summarize"
      },
      {
        projectId: project.id,
        employeeId: "employee_crawler",
        skillId: "agent-browser"
      },
      {
        projectId: project.id,
        employeeId: "employee_crawler",
        skillId: "filesystem"
      }
    ]
  });

  console.log("OpenSwarm SaaS seed complete");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
