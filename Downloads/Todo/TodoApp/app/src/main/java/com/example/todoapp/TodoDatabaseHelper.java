package com.example.todoapp;

import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteOpenHelper;

import java.util.ArrayList;
import java.util.List;

// Déclaration de la classe TodoDatabaseHelper qui étend SQLiteOpenHelper
public class TodoDatabaseHelper extends SQLiteOpenHelper {
    // Nom de la base de données
    private static final String DATABASE_NAME = "todo.db";
    // Version de la base de données
    private static final int DATABASE_VERSION = 1;

    // Constructeur de la classe, prend le contexte en paramètre
    public TodoDatabaseHelper(Context context) {
        super(context, DATABASE_NAME, null, DATABASE_VERSION);
    }

    // Méthode appelée lors de la création de la base de données
    @Override
    public void onCreate(SQLiteDatabase db) {
        // Création de la table "tasks" avec trois colonnes : _id, name, et status
        db.execSQL("CREATE TABLE tasks ("
                + "_id INTEGER PRIMARY KEY AUTOINCREMENT, "
                + "name TEXT, "
                + "status TEXT, "
                + "description TEXT);");
    }

    // Méthode appelée lors de la mise à jour de la base de données
    @Override
    public void onUpgrade(SQLiteDatabase db, int oldVersion, int newVersion) {
        // Suppression de la table "tasks" si elle existe déjà
        db.execSQL("DROP TABLE IF EXISTS tasks");
        // Récréation de la table "tasks"
        onCreate(db);
    }

    // Méthode pour activity_add_task.xml une tâche à la base de données
    public void addTask(Task task) {
        // Obtenir une instance en écriture de la base de données
        SQLiteDatabase db = this.getWritableDatabase();
        // Créer un ContentValues pour stocker les valeurs de la tâche
        ContentValues values = new ContentValues();
        values.put("name", task.getName());
        values.put("status", task.getStatus());
        values.put("description", task.getDescription()); // Ajout de la description
        // Insérer les valeurs dans la table "tasks"
        db.insert("tasks", null, values);
        db.close();
    }

    // Méthode pour obtenir toutes les tâches de la base de données
    public List<Task> getAllTasks() {
        // Créer une liste pour stocker les tâches
        List<Task> tasks = new ArrayList<>();
        // Obtenir une instance en lecture de la base de données
        SQLiteDatabase db = this.getReadableDatabase();
        // Exécuter une requête pour obtenir toutes les lignes de la table "tasks"
        Cursor cursor = db.query("tasks", null, null, null, null, null, null);

        // Parcourir le curseur et activity_add_task.xml chaque tâche à la liste
        while (cursor.moveToNext()) {
            long id = cursor.getLong(cursor.getColumnIndexOrThrow("_id"));
            String name = cursor.getString(cursor.getColumnIndexOrThrow("name"));
            String status = cursor.getString(cursor.getColumnIndexOrThrow("status"));
            String description = cursor.getString(cursor.getColumnIndexOrThrow("description")); // Récupération de la description
            tasks.add(new Task(id, name, status, description));
        }

        // Fermer le curseur
        cursor.close();

        db.close();

        // Retourner la liste des tâches
        return tasks;
    }

    // Méthode pour obtenir une tâche spécifique à partir de son ID
    public Task getTask(long id) {
        // Obtenir une instance en lecture de la base de données
        SQLiteDatabase db = this.getReadableDatabase();
        // Exécuter une requête pour obtenir la tâche avec l'ID spécifié
        Cursor cursor = db.query("tasks", null, "_id=?", new String[]{String.valueOf(id)}, null, null, null);

        // Si le curseur n'est pas null, obtenir les données de la tâche et retourner l'objet Task
        if (cursor != null) {
            cursor.moveToFirst();
            String name = cursor.getString(cursor.getColumnIndexOrThrow("name"));
            String status = cursor.getString(cursor.getColumnIndexOrThrow("status"));
            String description = cursor.getString(cursor.getColumnIndexOrThrow("description")); // Récupération de la description
            cursor.close();
            return new Task(id, name, status, description);
        }

        // Retourner null si la tâche n'a pas été trouvée
        return null;
    }

    // Méthode pour mettre à jour une tâche existante dans la base de données
    public void updateTask(Task task) {
        // Obtenir une instance en écriture de la base de données
        SQLiteDatabase db = this.getWritableDatabase();
        // Créer un ContentValues pour stocker les nouvelles valeurs de la tâche
        ContentValues values = new ContentValues();
        values.put("name", task.getName());
        values.put("status", task.getStatus());
        values.put("description", task.getDescription()); // Mise à jour de la description
        // Mettre à jour la table "tasks" avec les nouvelles valeurs pour l'ID spécifié
        db.update("tasks", values, "_id=?", new String[]{String.valueOf(task.getId())});
        db.close();
    }
}
