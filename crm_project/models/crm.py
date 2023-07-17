# -*- coding: utf-8 -*-

from odoo import models, fields, api, _


class crm(models.Model):
    _inherit = 'crm.lead'

    def _compute_projects_count(self):
        self.projects_count = self.env['project.project'].sudo().search_count([('opportunity_id', '=', self.id)])

    projects_count = fields.Integer(string='Repairs', compute="_compute_projects_count")

    def action_repair_lead_new(self):
        return self.action_new_projects()

    def action_new_projects(self):        
        context = {
                    'search_default_opportunity_id': self.id,
                    'default_opportunity_id': self.id,
                    'search_default_partner_id': self.partner_id.id,
                    'default_partner_id': self.partner_id.id,
                    'default_name': self.name,
                    'default_description': self.description,
                    'default_company_id': self.company_id.id or self.env.company.id,
                   }
        if self.user_id:
            context['default_user_id'] = self.user_id.id
        return {
                    'type': 'ir.actions.act_window',
                    'res_model': 'project.project',
                    'view_type': 'form',
                    'view_mode': 'form',
                    'target': 'new',
                    'context': context
                }
    
    def action_view_projects(self):
        domain = [['opportunity_id', '=', self.id]]
        return {
                    "name": _("Projects"),
                    "type": "ir.actions.act_window",
                    "res_model": "project.project",
                    #"context": {'group_by': 'state'},
                    "view_mode": "tree,form",
                    "domain": domain
                }