package com.example.todoapp;

import android.os.Bundle;
import android.view.View;
import android.widget.AdapterView;
import android.widget.Button;
import android.widget.EditText;
import android.widget.Spinner;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

public class AddTaskActivity extends AppCompatActivity {

    private EditText taskNameEditText;
    private EditText descriptionEditText;
    private Spinner statusSpinner;
    private String selectedStatus;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_add_task);

        taskNameEditText = findViewById(R.id.taskName);
        descriptionEditText = findViewById(R.id.description);
        statusSpinner = findViewById(R.id.status_spinner);

        String[] statuses = {"Status", "Todo", "In progress", "Done", "Bug"};
        int[] icons = {0, R.drawable.todo_icon, R.drawable.inprogress_icon, R.drawable.done_icon, R.drawable.bug_icon};

        CustomSpinnerAdapter adapter = new CustomSpinnerAdapter(this, statuses, icons);
        statusSpinner.setAdapter(adapter);

        statusSpinner.setOnItemSelectedListener(new AdapterView.OnItemSelectedListener() {
            @Override
            public void onItemSelected(AdapterView<?> parent, View view, int position, long id) {
                if (position != 0) { // Ignorer le premier élément (texte par défaut)
                    selectedStatus = statuses[position];
                } else {
                    selectedStatus = null; // Aucun statut sélectionné
                }
            }

            @Override
            public void onNothingSelected(AdapterView<?> parent) {
                selectedStatus = null; // Aucun statut sélectionné
            }
        });

        Button addButton = findViewById(R.id.addButton);
        addButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                String taskName = taskNameEditText.getText().toString().trim();
                String description = descriptionEditText.getText().toString().trim();

                if (taskName.isEmpty()) {
                    Toast.makeText(AddTaskActivity.this, "Please enter a task name", Toast.LENGTH_SHORT).show();
                    return;
                }

                if (selectedStatus == null) {
                    Toast.makeText(AddTaskActivity.this, "Please select a status", Toast.LENGTH_SHORT).show();
                    return;
                }

                TodoDatabaseHelper dbHelper = new TodoDatabaseHelper(AddTaskActivity.this);
                Task task = new Task(0, taskName, selectedStatus, description);
                dbHelper.addTask(task);

                Toast.makeText(AddTaskActivity.this, "Task added", Toast.LENGTH_SHORT).show();
                setResult(RESULT_OK);  // Indicate success
                finish();
            }
        });

        findViewById(R.id.cancelButton).setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                finish();
            }
        });
    }
}
