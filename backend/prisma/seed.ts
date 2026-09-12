import { PrismaClient, Role, ProjectStatus, TaskStatus, TaskPriority, NotificationType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clean existing data
  await prisma.notification.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.client.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 1. Create Users
  const admin = await prisma.user.create({
    data: {
      email: 'admin@agency.com',
      passwordHash,
      name: 'Alex Vance (Admin)',
      role: Role.ADMIN,
    },
  });

  const pm1 = await prisma.user.create({
    data: {
      email: 'sarah.pm@agency.com',
      passwordHash,
      name: 'Sarah Connor',
      role: Role.PROJECT_MANAGER,
    },
  });

  const pm2 = await prisma.user.create({
    data: {
      email: 'mike.pm@agency.com',
      passwordHash,
      name: 'Mike Ross',
      role: Role.PROJECT_MANAGER,
    },
  });

  const dev1 = await prisma.user.create({
    data: {
      email: 'ravi.dev@agency.com',
      passwordHash,
      name: 'Ravi Sharma',
      role: Role.DEVELOPER,
    },
  });

  const dev2 = await prisma.user.create({
    data: {
      email: 'priya.dev@agency.com',
      passwordHash,
      name: 'Priya Patel',
      role: Role.DEVELOPER,
    },
  });

  const dev3 = await prisma.user.create({
    data: {
      email: 'david.dev@agency.com',
      passwordHash,
      name: 'David Kim',
      role: Role.DEVELOPER,
    },
  });

  const dev4 = await prisma.user.create({
    data: {
      email: 'elena.dev@agency.com',
      passwordHash,
      name: 'Elena Rostova',
      role: Role.DEVELOPER,
    },
  });

  console.log('✅ Created 7 Users (1 Admin, 2 PMs, 4 Devs)');

  // 2. Create Clients
  const client1 = await prisma.client.create({
    data: {
      name: 'Acme Global Inc.',
      company: 'Acme Corp',
      email: 'contact@acmeglobal.com',
    },
  });

  const client2 = await prisma.client.create({
    data: {
      name: 'Stellar Dynamics',
      company: 'Stellar Inc',
      email: 'projects@stellardynamics.io',
    },
  });

  const client3 = await prisma.client.create({
    data: {
      name: 'Nexus Fintech',
      company: 'Nexus Group',
      email: 'tech@nexusfintech.com',
    },
  });

  console.log('✅ Created 3 Clients');

  // 3. Create Projects
  const project1 = await prisma.project.create({
    data: {
      title: 'E-Commerce Mobile Redesign',
      description: 'Next-gen iOS & Android shopping application with custom UI components and fast checkout.',
      clientId: client1.id,
      managerId: pm1.id,
      status: ProjectStatus.ACTIVE,
    },
  });

  const project2 = await prisma.project.create({
    data: {
      title: 'Enterprise Portal & API',
      description: 'Scalable cloud platform for enterprise client data aggregation and analytics APIs.',
      clientId: client2.id,
      managerId: pm1.id,
      status: ProjectStatus.ACTIVE,
    },
  });

  const project3 = await prisma.project.create({
    data: {
      title: 'AI Financial Analytics Engine',
      description: 'Real-time market signal detection and predictive risk modelling portal.',
      clientId: client3.id,
      managerId: pm2.id,
      status: ProjectStatus.ACTIVE,
    },
  });

  console.log('✅ Created 3 Projects');

  const now = new Date();
  const days = (n: number) => new Date(now.getTime() + n * 24 * 60 * 60 * 1000);

  // 4. Create Tasks
  // Project 1 Tasks
  const task1 = await prisma.task.create({
    data: {
      title: 'Design Checkout Wireframes',
      description: 'Create Figma prototypes for 1-click checkout experience.',
      projectId: project1.id,
      assigneeId: dev1.id,
      createdById: pm1.id,
      status: TaskStatus.DONE,
      priority: TaskPriority.HIGH,
      dueDate: days(-5),
      isOverdue: false,
    },
  });

  const task2 = await prisma.task.create({
    data: {
      title: 'Implement Stripe Payment Gateway',
      description: 'Integrate Apple Pay, Google Pay, and credit card tokenization.',
      projectId: project1.id,
      assigneeId: dev1.id,
      createdById: pm1.id,
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.CRITICAL,
      dueDate: days(1),
      isOverdue: false,
    },
  });

  const task3 = await prisma.task.create({
    data: {
      title: 'Fix iOS Safari Scroll Bug',
      description: 'Resolve rubber-band scrolling glitches on checkout page for mobile Safari browsers.',
      projectId: project1.id,
      assigneeId: dev2.id,
      createdById: pm1.id,
      status: TaskStatus.TO_DO,
      priority: TaskPriority.MEDIUM,
      dueDate: days(-3),
      isOverdue: true, // OVERDUE!
    },
  });

  const task4 = await prisma.task.create({
    data: {
      title: 'Shopping Cart State Persistence',
      description: 'Persist guest shopping cart items in local storage with auto-sync to backend DB.',
      projectId: project1.id,
      assigneeId: dev2.id,
      createdById: pm1.id,
      status: TaskStatus.IN_REVIEW,
      priority: TaskPriority.HIGH,
      dueDate: days(4),
      isOverdue: false,
    },
  });

  const task5 = await prisma.task.create({
    data: {
      title: 'Push Notification Service Setup',
      description: 'Configure Firebase Cloud Messaging for order delivery status updates.',
      projectId: project1.id,
      assigneeId: dev1.id,
      createdById: pm1.id,
      status: TaskStatus.TO_DO,
      priority: TaskPriority.LOW,
      dueDate: days(7),
      isOverdue: false,
    },
  });

  // Project 2 Tasks
  const task6 = await prisma.task.create({
    data: {
      title: 'Setup PostgreSQL Indexing & Prisma Schema',
      description: 'Define relational schema, foreign key cascade constraints, and B-tree indexes.',
      projectId: project2.id,
      assigneeId: dev3.id,
      createdById: pm1.id,
      status: TaskStatus.DONE,
      priority: TaskPriority.HIGH,
      dueDate: days(-10),
      isOverdue: false,
    },
  });

  const task7 = await prisma.task.create({
    data: {
      title: 'OAuth2 & SSO Integration',
      description: 'Implement Okta and SAML single sign-on authentication flow.',
      projectId: project2.id,
      assigneeId: dev3.id,
      createdById: pm1.id,
      status: TaskStatus.IN_REVIEW,
      priority: TaskPriority.CRITICAL,
      dueDate: days(2),
      isOverdue: false,
    },
  });

  const task8 = await prisma.task.create({
    data: {
      title: 'REST API Endpoint Performance Audit',
      description: 'Identify slow database queries and optimize N+1 selects on report generation endpoints.',
      projectId: project2.id,
      assigneeId: dev4.id,
      createdById: pm1.id,
      status: TaskStatus.TO_DO,
      priority: TaskPriority.HIGH,
      dueDate: days(-4),
      isOverdue: true, // OVERDUE!
    },
  });

  const task9 = await prisma.task.create({
    data: {
      title: 'Admin User Permissions Matrix UI',
      description: 'Build role-based permission checkbox matrix in React frontend.',
      projectId: project2.id,
      assigneeId: dev4.id,
      createdById: pm1.id,
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.MEDIUM,
      dueDate: days(3),
      isOverdue: false,
    },
  });

  const task10 = await prisma.task.create({
    data: {
      title: 'Docker Compose Deployment Pipeline',
      description: 'Write multi-stage Dockerfiles and container orchestration configurations.',
      projectId: project2.id,
      assigneeId: dev3.id,
      createdById: pm1.id,
      status: TaskStatus.TO_DO,
      priority: TaskPriority.LOW,
      dueDate: days(6),
      isOverdue: false,
    },
  });

  // Project 3 Tasks
  const task11 = await prisma.task.create({
    data: {
      title: 'Train Anomaly Detection Model',
      description: 'Train XGBoost classifier on historical transaction dataset.',
      projectId: project3.id,
      assigneeId: dev4.id,
      createdById: pm2.id,
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.CRITICAL,
      dueDate: days(5),
      isOverdue: false,
    },
  });

  const task12 = await prisma.task.create({
    data: {
      title: 'Build Live WebSocket Feed Pipeline',
      description: 'Implement Socket.io server logic with room-scoped message broadcasting.',
      projectId: project3.id,
      assigneeId: dev1.id,
      createdById: pm2.id,
      status: TaskStatus.IN_REVIEW,
      priority: TaskPriority.HIGH,
      dueDate: days(1),
      isOverdue: false,
    },
  });

  const task13 = await prisma.task.create({
    data: {
      title: 'Export Reports to PDF & CSV',
      description: 'Generate downloadable financial ledger reports with custom branding.',
      projectId: project3.id,
      assigneeId: dev2.id,
      createdById: pm2.id,
      status: TaskStatus.TO_DO,
      priority: TaskPriority.MEDIUM,
      dueDate: days(8),
      isOverdue: false,
    },
  });

  const task14 = await prisma.task.create({
    data: {
      title: 'Refactor Database Query Caching',
      description: 'Implement Redis LRU caching layer for dashboard telemetry data.',
      projectId: project3.id,
      assigneeId: dev3.id,
      createdById: pm2.id,
      status: TaskStatus.TO_DO,
      priority: TaskPriority.LOW,
      dueDate: days(10),
      isOverdue: false,
    },
  });

  const task15 = await prisma.task.create({
    data: {
      title: 'Security Vulnerability Audit',
      description: 'Perform dependency vulnerability scan and sanitize input parameters.',
      projectId: project3.id,
      assigneeId: dev4.id,
      createdById: pm2.id,
      status: TaskStatus.DONE,
      priority: TaskPriority.CRITICAL,
      dueDate: days(-2),
      isOverdue: false,
    },
  });

  console.log('✅ Created 15 Tasks across 3 Projects (including 2 Overdue tasks)');

  // 5. Seed Activity Logs
  const activitiesData = [
    {
      projectId: project1.id,
      taskId: task1.id,
      userId: dev1.id,
      action: 'TASK_STATUS_CHANGED',
      details: { oldStatus: 'IN_REVIEW', newStatus: 'DONE' },
      formattedMessage: 'Ravi Sharma moved Task "Design Checkout Wireframes" from In Review → Done',
      createdAt: new Date(now.getTime() - 25 * 60 * 1000),
    },
    {
      projectId: project1.id,
      taskId: task4.id,
      userId: dev2.id,
      action: 'TASK_STATUS_CHANGED',
      details: { oldStatus: 'IN_PROGRESS', newStatus: 'IN_REVIEW' },
      formattedMessage: 'Priya Patel moved Task "Shopping Cart State Persistence" from In Progress → In Review',
      createdAt: new Date(now.getTime() - 15 * 60 * 1000),
    },
    {
      projectId: project1.id,
      taskId: task3.id,
      userId: admin.id,
      action: 'TASK_OVERDUE',
      details: { isOverdue: true },
      formattedMessage: 'System flagged Task "Fix iOS Safari Scroll Bug" as OVERDUE',
      createdAt: new Date(now.getTime() - 10 * 60 * 1000),
    },
    {
      projectId: project2.id,
      taskId: task7.id,
      userId: dev3.id,
      action: 'TASK_STATUS_CHANGED',
      details: { oldStatus: 'IN_PROGRESS', newStatus: 'IN_REVIEW' },
      formattedMessage: 'David Kim moved Task "OAuth2 & SSO Integration" from In Progress → In Review',
      createdAt: new Date(now.getTime() - 8 * 60 * 1000),
    },
    {
      projectId: project2.id,
      taskId: task8.id,
      userId: admin.id,
      action: 'TASK_OVERDUE',
      details: { isOverdue: true },
      formattedMessage: 'System flagged Task "REST API Endpoint Performance Audit" as OVERDUE',
      createdAt: new Date(now.getTime() - 5 * 60 * 1000),
    },
    {
      projectId: project3.id,
      taskId: task12.id,
      userId: dev1.id,
      action: 'TASK_STATUS_CHANGED',
      details: { oldStatus: 'IN_PROGRESS', newStatus: 'IN_REVIEW' },
      formattedMessage: 'Ravi Sharma moved Task "Build Live WebSocket Feed Pipeline" from In Progress → In Review',
      createdAt: new Date(now.getTime() - 2 * 60 * 1000),
    },
  ];

  for (const act of activitiesData) {
    await prisma.activityLog.create({ data: act });
  }

  console.log('✅ Created 6 Initial Activity Logs');

  // 6. Seed Notifications
  await prisma.notification.create({
    data: {
      userId: pm1.id,
      title: 'Task Ready for Review',
      message: 'Priya Patel submitted "Shopping Cart State Persistence" for review.',
      type: NotificationType.TASK_IN_REVIEW,
      link: `/projects/${project1.id}`,
      isRead: false,
    },
  });

  await prisma.notification.create({
    data: {
      userId: pm1.id,
      title: 'Task Ready for Review',
      message: 'David Kim submitted "OAuth2 & SSO Integration" for review.',
      type: NotificationType.TASK_IN_REVIEW,
      link: `/projects/${project2.id}`,
      isRead: false,
    },
  });

  await prisma.notification.create({
    data: {
      userId: dev2.id,
      title: 'New Task Assignment',
      message: 'You have been assigned to task "Fix iOS Safari Scroll Bug".',
      type: NotificationType.TASK_ASSIGNED,
      link: `/projects/${project1.id}`,
      isRead: false,
    },
  });

  await prisma.notification.create({
    data: {
      userId: dev2.id,
      title: 'Task Overdue Alert',
      message: 'Task "Fix iOS Safari Scroll Bug" is overdue!',
      type: NotificationType.TASK_OVERDUE,
      link: `/projects/${project1.id}`,
      isRead: false,
    },
  });

  await prisma.notification.create({
    data: {
      userId: pm2.id,
      title: 'Task Ready for Review',
      message: 'Ravi Sharma submitted "Build Live WebSocket Feed Pipeline" for review.',
      type: NotificationType.TASK_IN_REVIEW,
      link: `/projects/${project3.id}`,
      isRead: false,
    },
  });

  console.log('✅ Created 5 Initial Notifications');
  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
