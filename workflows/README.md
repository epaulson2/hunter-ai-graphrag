# Hunter AI GraphRAG Workflows

This directory contains n8n workflow templates for the Hunter AI system.

## Workflow Files

### Core Workflows
- `content-aggregation.json` - RSS content collection and filtering
- `article-generation.json` - AI-powered article creation
- `business-mentions.json` - Business entity extraction and relationship mapping

### Utility Workflows
- `health-monitoring.json` - System health checks and alerts
- `analytics-reporting.json` - Daily/weekly analytics reports
- `data-cleanup.json` - Database maintenance and optimization

## Installation

1. Deploy n8n following the setup guide in `../docs/n8n-setup.md`
2. Access your n8n instance
3. Import workflows using the n8n interface:
   - Settings → Import/Export → Import from File
   - Select the JSON files from this directory

## Workflow Dependencies

Each workflow requires:
- Hunter AI API endpoints
- Supabase database access
- OpenAI API key
- Anthropic API key
- RSS feed URLs

## Customization

### RSS Sources
Update the RSS URLs in `content-aggregation.json`:
- Local news sources
- Business directories
- Community calendars
- Government feeds

### AI Parameters
Adjust AI settings in `article-generation.json`:
- Temperature settings
- Max tokens
- Prompt templates
- Hunter voice guidelines

### Business Rules
Modify business logic in `business-mentions.json`:
- Relevance scoring
- Partnership criteria
- Credit allocation

## Scheduling

- **Content Aggregation**: Every 2 hours during business hours
- **Article Generation**: Triggered by new content
- **Business Mentions**: Triggered by new articles
- **Health Monitoring**: Every 15 minutes
- **Analytics**: Daily at 6 AM

## Monitoring

Workflows include error handling:
- Retry logic for API failures
- Slack/email notifications for critical errors
- Logging to Hunter AI analytics system

## Testing

Before deploying:
1. Test each workflow manually in n8n
2. Verify API integrations
3. Check database permissions
4. Validate output quality

## Support

For workflow issues:
1. Check n8n execution logs
2. Verify API endpoints are responding
3. Review database connectivity
4. Check environment variables