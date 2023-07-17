# -*- coding: utf-8 -*-

from odoo import models, fields, api, _
import os
import logging
from datetime import datetime
import odoo.tools as tools
_logger = logging.getLogger(__name__)


class backup_automatized(models.Model):
    _name = 'backup.automatized'
    _description = 'Backup project to github'

    name = fields.Char(string="Nombre")

    github_username = fields.Char(string="Usuario")
    github_mail = fields.Char(string="Correo Electrónico")
    github_repository = fields.Char(string="Repositorio")
    github_branch = fields.Char(string="Branch")
    github_token = fields.Char(string="Token")

    def _set_addons_path(self):
        addons_path = tools.config.get('addons_path')
        self.addons_path = addons_path

    addons_path = fields.Text(string="Directorio de Modulos", default=_set_addons_path)

    database_name = fields.Char(string="Nombre")
    master_password = fields.Char(string="Contraseña")

    def send_to_github(self, repositories):
        # abspath = os.path.dirname(os.path.abspath(__file__))
        abspath = "/opt1"

        path = abspath + '/repository'
        
        backup_repositories = self.env['backup.automatized'].sudo().search(
            [('github_repository', 'in', repositories)])

        for backup_repository in backup_repositories:
            # account level directory
            level_1 = str(path)+str('/')+str(backup_repository.github_username)
            if(not os.path.exists(level_1)):
                os.makedirs(level_1, mode=0o777)

            # repository level directory
            level_2 = str(path)+str('/')+str(backup_repository.github_username) + \
                str('/')+str(backup_repository.github_repository)
            if(not os.path.exists(level_2)):
                os.makedirs(level_2, mode=0o777)

            # branch level directory
            level_3 = str(path)+str('/')+str(backup_repository.github_username)+str('/')+str(
                backup_repository.github_repository)+str('/')+str(backup_repository.github_branch)
            if(not os.path.exists(level_3)):
                os.makedirs(level_3, mode=0o777)
           
            addons_path = backup_repository.addons_path

            exec_dir = str("cd ") + str(level_3) + str("/") + str(" && ")

            if(addons_path):
                addons_path = addons_path.split(',')
                if(len(addons_path) > 0):
                    
                    os.system(str("find " + str(level_3) + " -type d -name '__pycache__' -exec rm -rf {} \; "))
                    os.system(str("find " + str(level_3) + " -type d -name '.ipynb_checkpoints' -exec rm -rf {} \; "))

                    # iteractive github
                    os.system(str(exec_dir) + str("git config --global user.email '" +str(backup_repository.github_mail) + "'"))
                    os.system(str(exec_dir) + str("git config --global user.name '" +str(backup_repository.github_username) + "'"))
                    _logger.warning( str(exec_dir) + str("git clone -b " + str(backup_repository.github_branch) + " https://" + str(backup_repository.github_token) + str("@github.com/") + str(backup_repository.github_username) + str("/") + str(backup_repository.github_repository) + str(".git")) )
                    # os.system(str(exec_dir) + str("git clone -b " + str(backup_repository.github_branch) + " https://" + str(backup_repository.github_token) + str("@github.com/") + str(backup_repository.github_username) + str("/") + str(backup_repository.github_repository) + str(".git")))                    
                    _logger.info (  str(exec_dir) + str("eval `ssh-agent -s` &&  ssh-add  /livecargo.priv  &&   git clone -b ") + str(backup_repository.github_branch) + " git" +  str("@github.com:") + str(backup_repository.github_username) + str("/") + str(backup_repository.github_repository) + str(".git"))  
                    os.system(str(exec_dir) + str("eval `ssh-agent -s` &&  ssh-add  /livecargo.priv  &&   git clone -b ") + str(backup_repository.github_branch) + " git" +  str("@github.com:") + str(backup_repository.github_username) + str("/") + str(backup_repository.github_repository) + str(".git"))  

                    



                    BACKUP_DIRECTORY = str(level_3) + str("/") 
                    _logger.info("Directorio %s", BACKUP_DIRECTORY)
                    _logger.info("Listado del directorio= %s", os.listdir(BACKUP_DIRECTORY) )



                    now = datetime.now()
                    now_readable = now.strftime("%d.%m.%Y.%H.%M.%S")

                    if(os.path.exists(level_3)):
                        os.chmod(level_1, mode=0o777)
                        url = self.env['ir.config_parameter'].sudo().get_param('web.base.url')
                        os.system("curl -X POST -F 'master_pwd=" + str(backup_repository.master_password) + "' -F 'name=" + str(backup_repository.database_name) + str("' -F 'backup_format=zip' -o ") + str(level_3) + str("/") + str(backup_repository.github_repository) + str("/") + str(backup_repository.database_name) + str(".zip ") + str(url) + str("/web/database/backup"))                        
                        

                    for addon_path in addons_path:                            
                        # move directories
                        os.system(str("cp -rf ") + str(addon_path) +str("/*") + str(" ") + str(level_3) + str("/") + str(backup_repository.github_repository))      
                        _logger.warning(str("cp -rf ") + str(addon_path) +str("/*") + str(" ") + str(level_3) + str("/") + str(backup_repository.github_repository))                

                    exec_dir = str("cd ") + str(level_3) + str("/") + str(backup_repository.github_repository) + str("/") + str(" && ")

                    zip_book = str(exec_dir) + "zip " + str(backup_repository.database_name) + ".zip --out database-"+str(now_readable)+".zip -s 100m"
                    os.system(zip_book)

                    rm_db_zip = str(exec_dir) + "rm -r " + str(backup_repository.database_name) + ".zip"
                    os.system(rm_db_zip)

                    #auth = "https://github.com/" + str(backup_repository.github_username) + "/" + str(backup_repository.github_repository) + str(".git")                    

                    init = str(exec_dir) + str("git init '" + str(level_3)  + str("/") + str(backup_repository.github_repository) + "/'")
                    safe = str(exec_dir) + str("git config --global --add safe.directory " + str(level_2) + str("/") + str(backup_repository.github_branch) + str("/") + str(backup_repository.github_repository))
                    response = os.system(init + str(' && ') + safe)
                    _logger.warning(response)                

                    fetch = str(exec_dir) + str("git fetch origin ") + str(backup_repository.github_branch)
                    response = os.system(fetch)
                    _logger.warning(response)
                    
                    checkout = str(exec_dir) + str("git checkout ") + str(backup_repository.github_branch)
                    response = os.system(checkout)
                    _logger.warning(response)

                    branch = str(exec_dir) + str("git branch -M '" + str(backup_repository.github_branch) + str("'"))
                    response = os.system(branch)
                    _logger.warning(response)

                    # BG remove backup directories for pushing
                    if(os.path.exists(level_3)):
                        os.chmod(level_1, mode=0o777)
                        
                    for addon_path in addons_path:                            
                        _logger.warning("***** directory ****")
                        #_logger.warning(str("rm -r ") + str(" ") + str(level_3) + str("/") + str(backup_repository.github_repository) + str("/") + str("backup_automatized/models/repository/*"))
                        #os.system(str("rm -r ") + str(addon_path) +str("/*") + str(" ") + str(level_3) + str("/") + str(backup_repository.github_repository) + str("/") + str("backup_automatized/models/repository/*"))
                    # EOF

                    add = str(exec_dir) + str("git add ") + str(level_3) + str("/") + str(backup_repository.github_repository) + "/"
                    _logger.warning(add)
                    response = os.system(add)
                    _logger.warning(response)


                    status = str(exec_dir) + str("git status")

                    response = os.system(status)
                    _logger.warning("status pre: %s", response)
                    

                    commit = str(exec_dir) + str("git commit -m 'odoo backup - " + str(now_readable) + "'")
                    response = os.system(commit)
                    _logger.warning(response)

                    status = str(exec_dir) + str("git status")
                    _logger.warning("status: %s", status)
                    response = os.system(status)
                    _logger.warning("status post: %s", response)
                    
                    _logger.warning(response)



                    BACKUP_DIRECTORY = str(level_3) + str("/") + str(backup_repository.github_repository) + str("/") 
                    _logger.info(BACKUP_DIRECTORY)
                    _logger.info(os.listdir(BACKUP_DIRECTORY))



                    config_memory = str(exec_dir) + str("git config --global pack.windowMemory") + str(" '32m'")
                    response = os.system(config_memory)
                    _logger.warning("config_memory: %s", response)
                    # _logger.warning(response)
                    
                    # push = str(exec_dir) + str("git push --set-upstream origin ") + str(backup_repository.github_branch)
                    push = str(exec_dir) + str("eval `ssh-agent -s` &&  ssh-add  /livecargo.priv  && git push ") 

                    # push = str(exec_dir) + str("eval `ssh-agent -s` &&  ssh-add  /livecargo.priv  && git push ") 

                    # response = os.system(push)
                    _logger.warning("push: %s", os.system(push) )
                    
                    _logger.warning(response)
                    
                    # keep writable from first level directory
                    if(os.path.exists(level_3)):
                        os.chmod(level_1, mode=0o777)
                    # EOF
                    