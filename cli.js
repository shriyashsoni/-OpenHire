#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const { program } = require('commander');
const inquirer = require('inquirer');
const chalk = require('chalk');
const ora = require('ora');

program
  .version('1.0.0')
  .description('Create a modern HR platform and career page for your startup.')
  .argument('[project-directory]', 'The directory to create the project in')
  .option('--company-name <name>', 'Your company name')
  .option('--company-tagline <tagline>', 'Your company tagline or mission statement')
  .option('--website-url <url>', 'Your main website URL')
  .option('--primary-color <color>', 'Your primary brand color (hex)')
  .option('--contact-email <email>', 'Your support/contact email address')
  .action((projectDirectory, options) => {
    run(projectDirectory, options);
  });

program.parse(process.argv);

async function run(projectDirectory, options) {
  let directory = projectDirectory;

  if (!directory) {
    const res = await inquirer.prompt([
      {
        type: 'input',
        name: 'directory',
        message: 'What is your project named?',
        default: 'my-hr-platform',
      },
    ]);
    directory = res.directory;
  }

  const targetPath = path.resolve(process.cwd(), directory);

  if (fs.existsSync(targetPath)) {
    console.error(chalk.red(`\nError: Directory ${directory} already exists. Please choose another name or delete it first.\n`));
    process.exit(1);
  }

  const prompts = [];
  
  if (!options.companyName) {
    prompts.push({
      type: 'input',
      name: 'companyName',
      message: 'What is your company name?',
      default: 'OpenHire',
    });
  }
  
  if (!options.companyTagline) {
    prompts.push({
      type: 'input',
      name: 'companyTagline',
      message: 'What is your company tagline or mission statement?',
      default: 'Join our team and help us build amazing products.',
    });
  }
  
  if (!options.websiteUrl) {
    prompts.push({
      type: 'input',
      name: 'websiteUrl',
      message: 'What is your main website URL?',
      default: 'https://openhire.shriyashsoni.social/',
    });
  }
  
  if (!options.primaryColor) {
    prompts.push({
      type: 'input',
      name: 'primaryColor',
      message: 'What is your primary brand color (hex)?',
      default: '#5d3c98',
    });
  }
  
  if (!options.contactEmail) {
    prompts.push({
      type: 'input',
      name: 'contactEmail',
      message: 'What is your support/contact email address?',
      default: 'hello@openhire.dev',
    });
  }

  const promptedAnswers = prompts.length > 0 ? await inquirer.prompt(prompts) : {};
  
  const answers = {
    companyName: options.companyName || promptedAnswers.companyName,
    companyTagline: options.companyTagline || promptedAnswers.companyTagline,
    websiteUrl: options.websiteUrl || promptedAnswers.websiteUrl,
    primaryColor: options.primaryColor || promptedAnswers.primaryColor,
    contactEmail: options.contactEmail || promptedAnswers.contactEmail,
  };

  const spinner = ora('Setting up your HR Platform...').start();

  try {
    // 1. Copy the template
    const templatePath = path.join(__dirname, 'template');
    await fs.copy(templatePath, targetPath);

    spinner.text = 'Customizing platform for your company...';

    // 2. Setup Privacy Policy
    const privacyPolicyHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Privacy Policy | {{COMPANY_NAME}}</title>
    <link rel="stylesheet" href="styles.css">
    <style>
        .content-container { max-width: 800px; margin: 40px auto; padding: 20px; line-height: 1.6; }
        .content-container h1, .content-container h2 { font-family: var(--font-serif); }
    </style>
</head>
<body>
    <nav class="navbar">
        <div class="container nav-container">
            <a href="{{WEBSITE_URL}}/" class="logo">{{COMPANY_NAME}}</a>
        </div>
    </nav>
    <div class="content-container">
        <h1>Privacy Policy</h1>
        <p>Last updated: \${new Date().toLocaleDateString()}</p>
        <h2>1. Introduction</h2>
        <p>Welcome to {{COMPANY_NAME}}. We are committed to protecting your personal information and your right to privacy. If you have any questions or concerns about this privacy notice, or our practices with regards to your personal information, please contact us at {{CONTACT_EMAIL}}.</p>
        <h2>2. Information We Collect</h2>
        <p>We collect personal information that you voluntarily provide to us when you apply for a job or express an interest in obtaining information about us or our products and services.</p>
        <h2>3. How We Use Your Information</h2>
        <p>We use personal information collected via our Website for a variety of business purposes described below. We process your personal information for these purposes in reliance on our legitimate business interests, in order to enter into or perform a contract with you, with your consent, and/or for compliance with our legal obligations.</p>
        <h2>4. Contact Us</h2>
        <p>If you have questions or comments about this notice, you may email us at {{CONTACT_EMAIL}}.</p>
    </div>
</body>
</html>
    `;
    await fs.writeFile(path.join(targetPath, 'privacy-policy.html'), privacyPolicyHtml);

    const termsHtml = privacyPolicyHtml.replace(/Privacy Policy/g, 'Terms & Conditions').replace(/privacy notice/g, 'terms');
    await fs.writeFile(path.join(targetPath, 'terms-conditions.html'), termsHtml);


    // 3. Find and replace in all files
    async function replaceInFiles(dir) {
      const files = await fs.readdir(dir);
      for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = await fs.stat(fullPath);

        if (stat.isDirectory()) {
          // Ignore node_modules and .git if they exist
          if (file !== 'node_modules' && file !== '.git') {
            await replaceInFiles(fullPath);
          }
        } else {
          // Only replace in text files
          if (/\.(html|js|css|ts|json|txt|xml|md)$/.test(file)) {
            let content = await fs.readFile(fullPath, 'utf8');
            let originalContent = content;

            // Replacements
            content = content.replace(/OpenHire/gi, answers.companyName);
            content = content.replace(/Join OpenHire and be part of the mission to democratize expert career guidance for students everywhere\./gi, answers.companyTagline);
            content = content.replace(/democratize expert career guidance for students everywhere/gi, answers.companyTagline);
            content = content.replace(/Guiding futures, one student at a time\. The premier platform for expert career counseling\./gi, answers.companyTagline);
            content = content.replace(/OpenHire is an education company working to provide expert counseling to students everywhere\. Explore our open positions and join our team\./gi, answers.companyTagline);
            content = content.replace(/https:\/\/openhire\.dev\//gi, answers.websiteUrl.endsWith('/') ? answers.websiteUrl : answers.websiteUrl + '/');
            content = content.replace(/https:\/\/openhire\.dev/gi, answers.websiteUrl);
            content = content.replace(/openhire\.dev/gi, answers.websiteUrl.replace(/^https?:\/\//, ''));
            content = content.replace(/admin@openhire\.dev/gi, 'admin@' + answers.websiteUrl.replace(/^https?:\/\//, '').replace(/^www\./, ''));
            content = content.replace(/hello@openhire\.dev/gi, answers.contactEmail);
            content = content.replace(/#5d3c98/gi, answers.primaryColor);

            // Replace CLI placeholders generated in privacy policy
            content = content.replace(/\{\{COMPANY_NAME\}\}/g, answers.companyName);
            content = content.replace(/\{\{WEBSITE_URL\}\}/g, answers.websiteUrl.endsWith('/') ? answers.websiteUrl.slice(0, -1) : answers.websiteUrl);
            content = content.replace(/\{\{CONTACT_EMAIL\}\}/g, answers.contactEmail);

            if (content !== originalContent) {
              await fs.writeFile(fullPath, content, 'utf8');
            }
          }
        }
      }
    }

    await replaceInFiles(targetPath);

    // Update package.json name
    const packageJsonPath = path.join(targetPath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const pkg = await fs.readJson(packageJsonPath);
      pkg.name = directory;
      pkg.version = "1.0.0";
      await fs.writeJson(packageJsonPath, pkg, { spaces: 2 });
    }

    spinner.succeed('HR Platform setup complete!');

    console.log(chalk.green(`\nSuccess! Created ${directory} at ${targetPath}`));
    console.log(`\nInside that directory, you can run several commands:\n`);
    console.log(chalk.cyan(`  npm install`));
    console.log(`    Installs the dependencies.\n`);
    console.log(chalk.cyan(`  npm run dev`));
    console.log(`    Starts the development server.\n`);
    console.log(chalk.cyan(`  npx convex dev`));
    console.log(`    Starts Convex backend sync.\n`);
    console.log(`\nWe suggest that you begin by typing:\n`);
    console.log(chalk.cyan(`  cd ${directory}`));
    console.log(chalk.cyan(`  npm install`));
    console.log(chalk.cyan(`  npx convex dev`));
    console.log(chalk.cyan(`  npm run dev`));
    console.log(`\n${chalk.yellow('Important: Don\\'t forget to replace the logo.jpg, logo.png, and logo.svg files with your own company logo!')}\n`);

  } catch (err) {
    spinner.fail('Failed to setup HR Platform');
    console.error(err);
    process.exit(1);
  }
}
