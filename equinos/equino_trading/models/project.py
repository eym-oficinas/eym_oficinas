# -*- coding: utf-8 -*-

from odoo import models, fields, api, _
import logging
_logger = logging.getLogger(__name__)
from odoo.exceptions import UserError

class project(models.Model):
    _inherit = 'project.project'
    _description = 'Project Tracker'
    
    is_equine = fields.Boolean(string='Equine Trading', default=True)
    is_checklist = fields.Boolean(string='Checklist', default=False)
    certificates_regulates_ids = fields.One2many('certificates.regulates', string='Documents', inverse_name="project_id")
    project_tracker_grid_ids = fields.One2many('project.tracker.grid', string='Tracks', inverse_name="project_id")
    crm_lead_id = fields.One2many('crm.lead', string='Oportunity', inverse_name="project_id")
    service_type = fields.Selection(string='Service Type', selection=[['export','Export'],['import','Import'],['transit','Transit']])
    sequence_date = fields.Date(string='Arrival / Departure Date', related='crm_lead_id.sequence_date')
    is_trading_template = fields.Boolean(string='Template')
    
    def action_replicate_project_tracking(self):
        new_project = self.copy()
        new_project.sudo().update({
                                    'service_type': str(self.service_type),
                                    'is_trading_template': False,
                                    })
    
    def replicate_project_tracking(self, crm_lead):
        new_project = crm_lead.project_id.copy()   
        id=None
        id = crm_lead._origin.id
        if id:
            count =  self.env['project.project'].search_count([['crm_lead_id','=',id],['is_trading_template','=',False]])
            if count == 0:
                new_project.sudo().update({
                                            'name': str(crm_lead.name),
                                            'partner_id': int(crm_lead.partner_id.id),
                                            'service_type': str(crm_lead.service_type),
                                            'is_trading_template': False,
                                            })

                tracker_grid = self.env['project.tracker.grid'].search([['project_id','=',int(new_project.id)]])
                
                if not tracker_grid:
                    self.env['project.tracker.grid'].create({'name':new_project.name,'project_id':new_project.id,'estimate_departmenture_arrival':new_project.sequence_date}) 
                else:
                    new_project.project_tracker_grid_ids.update({'estimate_departmenture_arrival':self.sequence_date}) 
            else:
                raise UserError('Already exist a project tracker for this oportunity. Remove it or edit instead.')
        else:
            raise UserError('System Error')
        _logger.info("SIT new_proyect= %s ", new_project)
        return new_project
    
    def action_view_track(self):
        
        for record in self:
            tracker_grid = self.env['project.tracker.grid'].search([['project_id','=',int(record.id)]])
            if not tracker_grid:
                self.env['project.tracker.grid'].create({'name':record.name,'project_id':record.id,'estimate_departmenture_arrival':record.sequence_date}) 
            else:
                record.project_tracker_grid_ids.update({'estimate_departmenture_arrival':self.sequence_date}) 
            
            filter = [
                        ['project_id', '=', record.id],
                     ]
            tree_id = self.env.ref('equino_trading.view_project_tracker_grid_tree')
            return {
                        "name": _("Track for " + str(record.name) ),
                        "type": "ir.actions.act_window",
                        "res_model": "project.tracker.grid",
                        "views": [[tree_id.id, "tree"]],
                        "view_mode": "tree",
                        "domain": filter
                    }

class project_type(models.Model):
    _inherit = 'project.task.type'
    
    force_state = fields.Selection(string='State', selection=[['normal','In Progres'],['blocked','Blocked'],['done','Ready']])


class project_task(models.Model):
    _inherit = 'project.task'
    _description = 'Project Task'    
        
    @api.onchange('stage_id')
    def _onchange_stage_id(self):
        if self.stage_id.force_state:
            self.kanban_state = self.stage_id.force_state                

class project_tracks(models.Model):
    _name = 'project.tracker.grid'
    _description = 'Project Tracker Grid'
    
    def compute_name(self):
        for record in self:
            if record.project_id:
                record.name = record.project_id.name

    name = fields.Char(string='Name')
    
    project_id = fields.Many2one('project.project', string='Tracks', inverse_name="project_tracker_grid_ids")
    service_type = fields.Selection(string='Service Type', related='project_id.service_type')

    estimate_departmenture_arrival = fields.Datetime(string='Estimate Departure / Arrival(A)(I/E/T)')
    realse_date_departure = fields.Datetime(string='Relase Date/Departure(O)(I/E)')
    #Nuevo
    shipping_list = fields.Boolean(string='Shipping list(O)(I/E/T)')

    import_permit = fields.Boolean(string='Import Permit(O)(I/T)')
    import_permit_paid = fields.Boolean(string='Import Permit Paid(O)(I)')
    usda_res_72hrs = fields.Boolean(string='USDA RES 72HRS(O)(I/E/T)')
    usda_res_72hrs_date = fields.Date(string='72HRS/PERMIT USDA SENT DATE(O)(I/E/T)')
    #Nuevos campos
    contingency_plan = fields.Date(string='Contingency plan(O)(T)')
    shipping_list_final_dest = fields.Boolean(string='Shippping list final destination(O)(I)')

    field_17_29 = fields.Boolean(string='17-29(O)(I)')
    usda_mac_sent_date = fields.Date(string='17-29 SENT DATE(O)(I/E/T)')
    #Nuevos campos
    coord_shipping_list_drivers = fields.Boolean(string='Coordinar shipping list drivers(O)(I)')
    hc_origin = fields.Boolean(string='Helath certificate Origin(O)(I/T)')

    hc_start_res_paid = fields.Date(string='H C Start(A)(E)')
    hc_end_res_paid = fields.Date(string='H C End(A)(E)')
    hc_expiration = fields.Date(string='H C Expiration(A)(E)')
    hc_sent_to_usda = fields.Date(string='H C sent to USDA(A)(E)')
    #Nuevos campos
    import_permit_destinity_country = fields.Date(string='Import Permit Destinity country send Veterinary(A)(E)')
    jockey_club = fields.Boolean(string='Jockey Club(A)(E)')

    billed_paid = fields.Selection(string='BILLED / PAID(C)(I/E/T)', selection=[['billed','Billed'],['paid', 'Paid']])
    mac_shipment_id = fields.Char(string='MAC Shipment ID(O)(I)')
    custom_clarance = fields.Date(string='Custom Clearance(O)(I)')
    #Nuevos campos
    commercial_invoice = fields.Boolean(string='Comercial Invoice(O)(I/E/T)')

    invoice_shipping_ccial_freigth_forward = fields.Char(string='Envio Factura CCial Freight Forward/ EXPO(O)(E)')
    awb = fields.Char(string='AWB(O)(I/E/T)')
    airline_reserve_guide = fields.Char(string='Reserva y Guia Aerolinea / Expo(O)(I/E)')
    commercial_invoice_and_awv_sent_to_c = fields.Date(string='Commecial invoice ans AWB send to customer(O)(E)')
    animal_handler = fields.Char(string='Animal Handler(A)(E)')
    animal_handler_confirmed = fields.Boolean(string='Animal Handler Confirmed(A)(E)')
    pc_check_date = fields.Date(string='PC CHECK DATE(O)(I)')
    pc_check = fields.Boolean(string='PC CHECK(O)(I)')    
    stalls = fields.Char(string='STALLS(O)(I/E)')
    cert_origin = fields.Char(string='Cert of Origen(O)(I)')
    #Nuevos campos
    coordinar_wls = fields.Boolean(string='Coordinar WLS(A)(I/E/T)')
    coordinar_mac = fields.Boolean(string='Coordinar MAC(A)(I/E/T)')
    coordinar_conductor = fields.Char(string='Coordinar conductor(A)(I/E)')

    #BORRAR    
    q_start_reserve = fields.Datetime(string='Q Start / Reserve()()')
    stalls_in_start = fields.Date(string='STALLS IN Start()()')
    tags_ship = fields.Char(string='TAGS  SHIP()()')
    actual_work = fields.Integer(string='Actual Work (in hours)()()')
    pending = fields.Char(string='Pending()()')
    stalls_2 = fields.Char(string='STALLS2()()')
    stalls_set3 = fields.Char(string='STALLS set3()()')
    pending6 = fields.Char(string='pending6()()')
    is_trading_template = fields.Boolean(string='Template', related="project_id.is_trading_template", store=True)


    hc_endorsed = fields.Char(string='HC ENDORSED()()')
    awb_paid = fields.Char(string='AWB PAID()()')




    @api.model
    def create(self, values):
        track = super (project_tracks, self).create(values)
        for record in self:
            if track:
                count = self.env['project.tracker.grid'].search_count([['project_id','=',int(record.project_id.id)]])
                if count > 0:
                    raise UserError("Project track already exist")
            
        return track