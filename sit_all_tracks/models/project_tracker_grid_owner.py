# -*- coding: utf-8 -*-

from odoo import models, fields, api, _
import logging
_logger = logging.getLogger(__name__)
from odoo.exceptions import UserError
import logging
_logger = logging.getLogger(__name__)


class sit_all_tracks(models.Model):
    _name = 'sit_all_tracks.sit_all_tracks'
    _description = 'sit_all_tracks.sit_all_tracks'

    # name = fields.Char("Nombre")
#     value = fields.Integer()
#     value2 = fields.Float(compute="_value_pc", store=True)
#     description = fields.Text()
#
#     @api.depends('value')
#     def _value_pc(self):
#         for record in self:
#             record.value2 = float(record.value) / 100
    service_type = fields.Selection(selection="_get_tracking_type",  string='Service Type')
    responsability = fields.Selection(string='Responsability', selection=[['OPERATIONS','OPERATIONS'],['ADMINISTRATION','ADMINISTRATION'],['CEO','CEO']])
    # sit_owner = fields.Many2one('res.users', string='Responsable', default=lambda self: self.env.user, tracking=True)


    def _get_tracking_type(self):
        # Obtiene el cursor de la base de datos
        cr = self.env.cr
        # Define la consulta SQL
        consulta_sql = """
            SELECT column_name FROM information_schema.columns WHERE table_name = %s;
        """
        # Ejecuta la consulta SQL con parámetros (en este caso, %s es un marcador de posición)
        cr.execute(consulta_sql, ('project_tracker_grid',))

        # Obtiene los resultados de la consulta
        resultados = cr.fetchall()
        _logger.info("SIT resultado =%s", resultados)
        # Procesa los resultados
        listado = []
        for res in resultados:

            if res[0] not in ['id','create_uid','write_uid','create_date','write_date']:
                resul1 = (res[0], res[0])
                print(resul1)
                listado.append(resul1)

            # resul1 = (res[0], res[0])
            # print(resul1)
            # listado.append(resul1)        


        # for fila in resultados:
        #     _logger.info("SIT fila =%s", fila)
        #     _logger.info("SIT fila =%s", fila())

            # id = fila[0]  # El índice 0 es la primera columna (id en este caso)
            # name = fila[1]  # El índice 1 es la segunda columna (name en este caso)

            # Realiza las operaciones necesarias con los datos obtenidos

        # No olvides gestionar adecuadamente la conexión y la transacción (commit/rollback)

        return listado

        # return [
        #     ("wsfe", _("Domestic market -without detail- RG2485 (WSFEv1)")),
        #     ("wsfex", _("Export -with detail- RG2758 (WSFEXv1)")),
        #     ("wsbfe", _("Fiscal Bond -with detail- RG2557 (WSBFE)")),
        # ]


