package com.maxisoft.concept;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

@CapacitorPlugin(name = "SaveFile")
public class SaveFilePlugin extends Plugin {

    private String pendingContent;

    @PluginMethod
    public void saveFile(PluginCall call) {
        String fileName = call.getString("fileName", "carte-concept.svg");
        String content = call.getString("content", "");
        String mimeType = call.getString("mimeType", "image/svg+xml");

        this.pendingContent = content;

        Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType(mimeType);
        intent.putExtra(Intent.EXTRA_TITLE, fileName);

        startActivityForResult(call, intent, "saveFileResult");
    }

    @ActivityCallback
    private void saveFileResult(PluginCall call, ActivityResult result) {
        if (call == null) return;

        if (result.getResultCode() == Activity.RESULT_OK && result.getData() != null) {
            Uri uri = result.getData().getData();
            if (uri != null && pendingContent != null) {
                try (OutputStream os = getContext().getContentResolver().openOutputStream(uri)) {
                    if (os != null) {
                        os.write(pendingContent.getBytes(StandardCharsets.UTF_8));
                        os.flush();
                        JSObject ret = new JSObject();
                        ret.put("success", true);
                        ret.put("uri", uri.toString());
                        call.resolve(ret);
                        return;
                    }
                } catch (Exception e) {
                    call.reject("Erreur lors de l'enregistrement: " + e.getMessage());
                    return;
                }
            }
        }

        JSObject ret = new JSObject();
        ret.put("success", false);
        ret.put("cancelled", true);
        call.resolve(ret);
    }
}
