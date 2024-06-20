package com.example.todoapp;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.AdapterView;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.EditText;
import android.widget.Spinner;
import android.util.Log;

import androidx.appcompat.app.AppCompatActivity;

public class EditTaskActivity extends AppCompatActivity {

    private EditText taskNameEditText;
    private EditText taskDescriptionEditText;
    private Spinner statusSpinner;
    private Button saveButton;
    private View cancelButton;
    private long taskId;
    private String selectedStatus;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_edit_task);

        taskNameEditText = findViewById(R.id.taskName);
        taskDescriptionEditText = findViewById(R.id.description);
        statusSpinner = findViewById(R.id.status_spinner);
        saveButton = findViewById(R.id.saveButton);
        cancelButton = findViewById(R.id.cancelButton);

        String[] statuses = {"Todo", "In progress", "Done", "Bug"};
        int[] icons = {R.drawable.todo_icon, R.drawable.inprogress_icon, R.drawable.done_icon, R.drawable.bug_icon};

        CustomSpinnerAdapter adapter = new CustomSpinnerAdapter(this, statuses, icons);
        statusSpinner.setAdapter(adapter);

        statusSpinner.setOnItemSelectedListener(new AdapterView.OnItemSelectedListener() {
            @Override
            public void onItemSelected(AdapterView<?> parent, View view, int position, long id) {
                selectedStatus = statuses[position];
            }

            @Override
            public void onNothingSelected(AdapterView<?> parent) {
                selectedStatus = statuses[0];
            }
        });

        // Get task data from the intent
        Intent intent = getIntent();
        taskId = intent.getLongExtra("TASK_ID", -1);
        String taskName = intent.getStringExtra("TASK_NAME");
        String taskStatus = intent.getStringExtra("TASK_STATUS");
        String taskDescription = intent.getStringExtra("TASK_DESCRIPTION");

        if (taskId == -1) {
            Log.e("EditTaskActivity", "Invalid task ID");
            finish();
            return;
        }

        // Populate UI with task data
        taskNameEditText.setText(taskName);
        statusSpinner.setSelection(adapter.getPosition(taskStatus));  // Set selected status in the spinner
        taskDescriptionEditText.setText(taskDescription);

        saveButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                try {
                    saveTask();
                } catch (Exception e) {
                    Log.e("EditTaskActivity", "Error saving task", e);
                }
            }
        });

        cancelButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                finish();
            }
        });
    }


    private void saveTask() {
        String name = taskNameEditText.getText().toString();
        String status = selectedStatus;
        String description = taskDescriptionEditText.getText().toString();

        if (name.isEmpty() || description.isEmpty() || status.isEmpty()) {
            Log.e("EditTaskActivity", "All fields must be filled");
            return;
        }

        Task updatedTask = new Task(taskId, name, status, description);
        TodoDatabaseHelper dbHelper = new TodoDatabaseHelper(this);

        try {
            dbHelper.updateTask(updatedTask);

            Intent resultIntent = new Intent();
            resultIntent.putExtra("TASK_ID", updatedTask.getId());
            resultIntent.putExtra("TASK_NAME", updatedTask.getName());
            resultIntent.putExtra("TASK_STATUS", updatedTask.getStatus());
            resultIntent.putExtra("TASK_DESCRIPTION", updatedTask.getDescription());
            setResult(RESULT_OK, resultIntent);
            finish();
        } catch (Exception e) {
            Log.e("EditTaskActivity", "Error saving task", e);
            // Affichez un message d'erreur à l'utilisateur ou prenez d'autres mesures en cas d'échec de la mise à jour
        }
    }

}
