<?php

require_once('models/DataObject.php');

class UserSystemModel extends DataObject {
    public $id;
    public $user_id;
    public $operating_systems;
    public $hardware;
    public $index;

    public function __construct() {
        parent::__construct();

        $this->table_name = USER_SYSTEMS;
    }

    public function getClassName() {
        return 'UserSystemModel';
    }

    public function getUserSystems($user_id) {
        $fetchedSystemsArray = $this->dbFetchArray(" " . USER_SYSTEMS . ".user_id={$user_id}");
        $systemsArray = array();
        foreach ($fetchedSystemsArray as $systemData) {
            $system = new UserSystemModel();
            $system->loadObject(array($systemData));
            $systemsArray[] = $system;
        }
        return $systemsArray;
    }

    public function getUserSystemsDictionary($user_id) {
        $systemsArray = $this->getUserSystems($user_id);
        $systemsDictionary = array();
        foreach ($systemsArray as $system) {
            $systemsDictionary[$system->id] = $system;
        }
        return $systemsDictionary;
    }

    public function storeUsersSystemsSettings($user_id, $system_id_array, $system_operating_systems_array, $system_hardware_array, $system_delete_array) {
        $userSystemsDictionary = $this->getUserSystemsDictionary($user_id);

        $last_system_index = 0;
        foreach ($system_id_array as $i => $system_id) {
            $system_operating_systems = $system_operating_systems_array[$i];
            $system_hardware = $system_hardware_array[$i];
            $system_delete = $system_delete_array[$i];

            if (array_key_exists($system_id, $userSystemsDictionary)) {
                $system = $userSystemsDictionary[$system_id];
                $system->user_id = $user_id;
                $system->operating_systems = $system_operating_systems;
                $system->hardware = $system_hardware;
                $system->index = ++$last_system_index;
                $system->save("id");
            }
        }
    }
}